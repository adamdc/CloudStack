/**
 *  Copyright (C) 2010 Cloud.com, Inc.  All rights reserved.
 * 
 * This software is licensed under the GNU General Public License v3 or later.
 * 
 * It is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */
package com.cloud.network.element;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.Local;
import javax.naming.ConfigurationException;

import org.apache.log4j.Logger;

import com.cloud.configuration.ConfigurationManager;
import com.cloud.dc.DataCenter;
import com.cloud.dc.DataCenter.NetworkType;
import com.cloud.dc.dao.HostPodDao;
import com.cloud.deploy.DeployDestination;
import com.cloud.exception.ConcurrentOperationException;
import com.cloud.exception.InsufficientCapacityException;
import com.cloud.exception.ResourceUnavailableException;
import com.cloud.network.IPAddressVO;
import com.cloud.network.Network;
import com.cloud.network.Network.Capability;
import com.cloud.network.Network.GuestIpType;
import com.cloud.network.Network.Provider;
import com.cloud.network.Network.Service;
import com.cloud.network.NetworkManager;
import com.cloud.network.Networks.TrafficType;
import com.cloud.network.PublicIpAddress;
import com.cloud.network.dao.IPAddressDao;
import com.cloud.network.dao.NetworkDao;
import com.cloud.network.router.VirtualNetworkApplianceManager;
import com.cloud.network.router.VirtualRouter;
import com.cloud.network.router.VirtualRouter.Role;
import com.cloud.network.rules.FirewallRule;
import com.cloud.offering.NetworkOffering;
import com.cloud.uservm.UserVm;
import com.cloud.utils.component.AdapterBase;
import com.cloud.utils.component.Inject;
import com.cloud.vm.DomainRouterVO;
import com.cloud.vm.NicProfile;
import com.cloud.vm.NicVO;
import com.cloud.vm.ReservationContext;
import com.cloud.vm.UserVmManager;
import com.cloud.vm.UserVmVO;
import com.cloud.vm.VirtualMachine;
import com.cloud.vm.VirtualMachine.State;
import com.cloud.vm.VirtualMachineProfile;
import com.cloud.vm.dao.DomainRouterDao;
import com.cloud.vm.dao.NicDao;
import com.cloud.vm.dao.UserVmDao;
import com.sun.jdi.connect.spi.TransportService.Capabilities;


@Local(value=NetworkElement.class)
public class ElasticIpElement extends AdapterBase implements NetworkElement{
    private static final Logger s_logger = Logger.getLogger(ElasticIpElement.class);
    
    private static final Map<Service, Map<Capability, String>> capabilities = setCapabilities();
    
    @Inject NetworkDao _networkConfigDao;
    @Inject NetworkManager _networkMgr;
    @Inject VirtualNetworkApplianceManager _routerMgr;
    @Inject UserVmManager _userVmMgr;
    @Inject UserVmDao _userVmDao;
    @Inject DomainRouterDao _routerDao;
    @Inject ConfigurationManager _configMgr;
    @Inject HostPodDao _podDao;
    @Inject NicDao _nicDao;
    @Inject IPAddressDao _ipAddressDao;
     
    private boolean canHandle(GuestIpType ipType, DeployDestination dest, TrafficType trafficType) {
        DataCenter dc = dest.getDataCenter();
        if (dc.getNetworkType() == NetworkType.Basic) {
            return (ipType == GuestIpType.Direct && trafficType == TrafficType.Guest);
        } 
        return false;
    }

    @Override
    public boolean implement(Network network, NetworkOffering offering, DeployDestination dest, ReservationContext context) throws ResourceUnavailableException, ConcurrentOperationException, InsufficientCapacityException {
        s_logger.debug("In ElasticIpElement.implement");
        if (!canHandle(network.getGuestType(), dest, offering.getTrafficType())) {
            s_logger.debug("ElasticIpElement.implement: cannot handle guest " + network.getGuestType() + ", traffic " + offering.getTrafficType());
            return false;
        }
        
        Map<VirtualMachineProfile.Param, Object> params = new HashMap<VirtualMachineProfile.Param, Object>(1);
        params.put(VirtualMachineProfile.Param.RestartNetwork, true);
        s_logger.debug("Asking router manager to deploy elastic ip vm if necessary");
        VirtualRouter eipVm = _routerMgr.deployElasticIpVm(network, dest, context.getAccount(), params);
        s_logger.debug("Elastic ip vm = " + eipVm);
        return true;
    }

    @Override
    public boolean prepare(Network network, NicProfile nic, VirtualMachineProfile<? extends VirtualMachine> vm, DeployDestination dest, ReservationContext context) throws ConcurrentOperationException, InsufficientCapacityException, ResourceUnavailableException {
        if (canHandle(network.getGuestType(), dest, network.getTrafficType())) {
            
            if (vm.getType() != VirtualMachine.Type.User) {
                return false;
            }
            
            @SuppressWarnings("unchecked")
            VirtualMachineProfile<UserVm> uservm = (VirtualMachineProfile<UserVm>)vm;
            Map<VirtualMachineProfile.Param, Object> params = new HashMap<VirtualMachineProfile.Param, Object>(1);
            params.put(VirtualMachineProfile.Param.RestartNetwork, true);
            s_logger.debug("Asking router manager to deploy elastic ip vm if necessary");
            VirtualRouter eipVm = _routerMgr.deployElasticIpVm(network, dest, context.getAccount(), params);
            s_logger.debug("Elastic ip vm = " + eipVm);
            if (eipVm != null) {
                nic.setElasticIpVmId(eipVm.getId());
            }
            return true;
        } else {
            s_logger.debug("ElasticIpElement.prepare: cannot handle guest " + network.getGuestType() + ", traffic " + network.getTrafficType());
            return false;
        }
    }

    @Override
    public boolean release(Network network, NicProfile nic, VirtualMachineProfile<? extends VirtualMachine> vm, ReservationContext context) {
        return true;
    }
    
    @Override
    public boolean shutdown(Network network, ReservationContext context) throws ConcurrentOperationException, ResourceUnavailableException {
        DomainRouterVO router = _routerDao.findByNetwork(network.getId());
        if (router == null) {
            return true;
        }
        return (_routerMgr.stop(router, false, context.getCaller(), context.getAccount()) != null);
    }
    
    @Override
    public boolean destroy(Network config) throws ConcurrentOperationException, ResourceUnavailableException{
        DomainRouterVO router = _routerDao.findByNetwork(config.getId());
        if (router == null) {
            return true;
        }
        return _routerMgr.destroyRouter(router.getId());
    }

    @Override
    public boolean applyRules(Network network, List<? extends FirewallRule> rules) throws ResourceUnavailableException {
        return false;
    }
    
    private DomainRouterVO findElasticIpVmForUserVm(long networkId, UserVmVO userVm) {
       //FIXME: do something more sophisticated here.
       return _routerDao.findByNetworkAndPodAndRole(networkId, userVm.getPodId(), Role.FIREWALL);
    }

    @Override
    public boolean applyIps(Network network, List<? extends PublicIpAddress> ipAddressList) throws ResourceUnavailableException {
        if (network.getGuestType() != GuestIpType.Direct)
            return false;
        boolean result = true;
        for (PublicIpAddress publicIp: ipAddressList){
            Long vmId = publicIp.getAssociatedWithVmId();
            if (vmId == null) {
                continue;
            }
             UserVmVO vm = _userVmDao.findById(vmId);
             NicVO nic = _nicDao.findByInstanceIdAndNetworkId(network.getId(), vmId);
             DomainRouterVO elasticIpVm = findElasticIpVmForUserVm(network.getId(), vm);
             List<IPAddressVO> assocIps = _ipAddressDao.findAllByAssociatedVmId(publicIp.getAssociatedWithVmId());
             Long oldId = null;
             for (IPAddressVO ip: assocIps) {
                 if (ip.getId()  != publicIp.getId()) {
                     oldId = ip.getId();
                     break;
                 }
             }
             result = result && _routerMgr.associateElasticIp(elasticIpVm, publicIp.getId(), nic.getIp4Address(), true, oldId);
             s_logger.debug("Associate elastic ip : " + publicIp.getAddress().toString() + " to " + nic.getIp4Address() + "result=" + result);
        }
        return result;
    }
    
    
    @Override
    public Provider getProvider() {
        return Provider.ElasticIpVm;
    }
    
    @Override
    public Map<Service, Map<Capability, String>> getCapabilities() {
        return capabilities;
    }
    
    private static Map<Service, Map<Capability, String>> setCapabilities() {
        Map<Service, Map<Capability, String>> capabilities = new HashMap<Service, Map<Capability, String>>();
        
        Map<Capability, String> firewallCapabilities = new HashMap<Capability, String>();
        firewallCapabilities.put(Capability.PortForwarding, "false");
        firewallCapabilities.put(Capability.TrafficStatistics, "per public ip");
        firewallCapabilities.put(Capability.StaticNat, "true");
        firewallCapabilities.put(Capability.PortFiltering, "none");
        
        capabilities.put(Service.Firewall, firewallCapabilities);   
        return capabilities;
    }
    
    @Override
    public boolean restart(Network network, ReservationContext context) throws ConcurrentOperationException, ResourceUnavailableException, InsufficientCapacityException{
        DataCenter dc = _configMgr.getZone(network.getDataCenterId());
        NetworkOffering offering = _configMgr.getNetworkOffering(network.getNetworkOfferingId());
        DeployDestination dest = new DeployDestination(dc, null, null, null);
        DomainRouterVO router = _routerDao.findByNetwork(network.getId());
        if (router == null) {
            s_logger.trace("Can't find dhcp element in network " + network.getId());
            return true;
        }
        
        VirtualRouter result = null;
        if (canHandle(network.getGuestType(), dest, offering.getTrafficType())) {
            if (router.getState() == State.Stopped) {
                result = _routerMgr.startRouter(router.getId(), false);
            } else {
                result = _routerMgr.rebootRouter(router.getId(), false);
            }
            if (result == null) {
                s_logger.warn("Failed to restart dhcp element " + router + " as a part of netowrk " + network + " restart");
                return false;
            } else {
                return true;
            }
        } else {
            s_logger.trace("Dhcp element doesn't handle network restart for the network " + network);
            return true;
        }
    }

}
