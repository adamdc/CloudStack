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
package com.cloud.ha.dao;

import java.util.Date;
import java.util.List;

import javax.ejb.Local;

import org.apache.log4j.Logger;

import com.cloud.ha.HaWorkVO;
import com.cloud.ha.HighAvailabilityManager;
import com.cloud.ha.HighAvailabilityManager.Step;
import com.cloud.ha.HighAvailabilityManager.WorkType;
import com.cloud.utils.db.Filter;
import com.cloud.utils.db.GenericDaoBase;
import com.cloud.utils.db.SearchBuilder;
import com.cloud.utils.db.SearchCriteria;
import com.cloud.utils.db.SearchCriteria.Op;
import com.cloud.utils.db.Transaction;
import com.cloud.utils.exception.CloudRuntimeException;

@Local(value={HighAvailabilityDao.class})
public class HighAvailabilityDaoImpl extends GenericDaoBase<HaWorkVO, Long> implements HighAvailabilityDao {
    private static final Logger s_logger = Logger.getLogger(HighAvailabilityDaoImpl.class);
	
    private final SearchBuilder<HaWorkVO> TBASearch;
    private final SearchBuilder<HaWorkVO> PreviousInstanceSearch;
    private final SearchBuilder<HaWorkVO> UntakenMigrationSearch;
    private final SearchBuilder<HaWorkVO> CleanupSearch;
    private final SearchBuilder<HaWorkVO> PreviousWorkSearch;
    private final SearchBuilder<HaWorkVO> TakenWorkSearch;
    private final SearchBuilder<HaWorkVO> ReleaseSearch;
    private final SearchBuilder<HaWorkVO> FutureHaWorkSearch;
    private final SearchBuilder<HaWorkVO> RunningHaWorkSearch;

    protected HighAvailabilityDaoImpl() {
        super();
        
        CleanupSearch = createSearchBuilder();
        CleanupSearch.and("time", CleanupSearch.entity().getTimeToTry(), Op.LTEQ);
        CleanupSearch.and("step", CleanupSearch.entity().getStep(), Op.IN);
        CleanupSearch.done();
        
        TBASearch = createSearchBuilder();
        TBASearch.and("server", TBASearch.entity().getServerId(), Op.NULL);
        TBASearch.and("taken", TBASearch.entity().getDateTaken(), Op.NULL);
        TBASearch.and("time", TBASearch.entity().getTimeToTry(), Op.LTEQ);
        TBASearch.done();
        
        PreviousInstanceSearch = createSearchBuilder();
        PreviousInstanceSearch.and("instance", PreviousInstanceSearch.entity().getInstanceId(), Op.EQ);
        PreviousInstanceSearch.done();
        
        UntakenMigrationSearch = createSearchBuilder();
        UntakenMigrationSearch.and("host", UntakenMigrationSearch.entity().getHostId(), Op.EQ);
        UntakenMigrationSearch.and("type", UntakenMigrationSearch.entity().getWorkType(), Op.EQ);
        UntakenMigrationSearch.and("server", UntakenMigrationSearch.entity().getServerId(), Op.NULL);
        UntakenMigrationSearch.and("taken", UntakenMigrationSearch.entity().getDateTaken(), Op.NULL);
        UntakenMigrationSearch.done();
        
        TakenWorkSearch = createSearchBuilder();
        TakenWorkSearch.and("type", TakenWorkSearch.entity().getWorkType(), Op.EQ);
        TakenWorkSearch.and("server", TakenWorkSearch.entity().getServerId(), Op.NNULL);
        TakenWorkSearch.and("taken", TakenWorkSearch.entity().getDateTaken(), Op.NNULL);
        TakenWorkSearch.and("step", TakenWorkSearch.entity().getStep(), Op.NIN);
        TakenWorkSearch.done();
        
        PreviousWorkSearch = createSearchBuilder();
        PreviousWorkSearch.and("instance", PreviousWorkSearch.entity().getInstanceId(), Op.EQ);
        PreviousWorkSearch.and("type", PreviousWorkSearch.entity().getWorkType(), Op.EQ);
        PreviousWorkSearch.and("taken", PreviousWorkSearch.entity().getDateTaken(), Op.NULL);
        PreviousWorkSearch.done();
        
        ReleaseSearch = createSearchBuilder();
        ReleaseSearch.and("server", ReleaseSearch.entity().getServerId(), Op.EQ);
        ReleaseSearch.and("step", ReleaseSearch.entity().getStep(), Op.NIN);
        ReleaseSearch.and("taken", ReleaseSearch.entity().getDateTaken(), Op.NNULL);
        ReleaseSearch.done();
        
        FutureHaWorkSearch = createSearchBuilder();
        FutureHaWorkSearch.and("instance", FutureHaWorkSearch.entity().getInstanceId(), Op.EQ);
        FutureHaWorkSearch.and("type", FutureHaWorkSearch.entity().getType(), Op.EQ);
        FutureHaWorkSearch.and("id", FutureHaWorkSearch.entity().getId(), Op.GT);
        FutureHaWorkSearch.done();
        
        RunningHaWorkSearch = createSearchBuilder();
        RunningHaWorkSearch.and("instance", RunningHaWorkSearch.entity().getInstanceId(), Op.EQ);
        RunningHaWorkSearch.and("type", RunningHaWorkSearch.entity().getType(), Op.EQ);
        RunningHaWorkSearch.and("taken", RunningHaWorkSearch.entity().getDateTaken(), Op.NNULL);
        RunningHaWorkSearch.and("step", RunningHaWorkSearch.entity().getStep(), Op.NIN);
        RunningHaWorkSearch.done();
    }
    
    @Override
    public List<HaWorkVO> listRunningHaWorkForVm(long vmId) {
        SearchCriteria<HaWorkVO> sc = RunningHaWorkSearch.create();
        sc.setParameters("instance", vmId);
        sc.setParameters("type", WorkType.HA);
        sc.setParameters("step", Step.Done, Step.Error, Step.Cancelled);
        
        return search(sc, null);
    }
    
    @Override
    public List<HaWorkVO> listFutureHaWorkForVm(long vmId, long workId) {
        SearchCriteria<HaWorkVO> sc = FutureHaWorkSearch.create();
        sc.setParameters("instance", vmId);
        sc.setParameters("type", HighAvailabilityManager.WorkType.HA);
        sc.setParameters("id", workId);
        
        return search(sc, null);
    }

    @Override
    public HaWorkVO take(final long serverId) {
        final Transaction txn = Transaction.currentTxn();
        try {
            final SearchCriteria<HaWorkVO> sc = TBASearch.create();
            sc.setParameters("time", System.currentTimeMillis() >> 10);

            final Filter filter = new Filter(HaWorkVO.class, null, true, 0l, 1l);

            txn.start();
            final List<HaWorkVO> vos = lockRows(sc, filter, true);
            if (vos.size() == 0) {
                txn.commit();
                return null;
            }

            final HaWorkVO work = vos.get(0);
            work.setServerId(serverId);
            work.setDateTaken(new Date());

            update(work.getId(), work);

            txn.commit();

            return work;

        } catch (final Throwable e) {
            throw new CloudRuntimeException("Unable to execute take", e);
        }
    }

    @Override
    public List<HaWorkVO> findPreviousHA(final long instanceId) {
        final SearchCriteria<HaWorkVO> sc = PreviousInstanceSearch.create();
        sc.setParameters("instance", instanceId);
        return listIncludingRemovedBy(sc);
    }

    @Override
    public void cleanup(final long time) {
        final SearchCriteria<HaWorkVO> sc = CleanupSearch.create();
        sc.setParameters("time", time);
        sc.setParameters("step", HighAvailabilityManager.Step.Done, HighAvailabilityManager.Step.Cancelled);
        expunge(sc);
    }

    @Override
    public void deleteMigrationWorkItems(final long hostId, final WorkType type, final long serverId) {
        final SearchCriteria<HaWorkVO> sc = UntakenMigrationSearch.create();
        sc.setParameters("host", hostId);
        sc.setParameters("type", type.toString());

        HaWorkVO work = createForUpdate();
        Date date = new Date();
        work.setDateTaken(date);
        work.setServerId(serverId);
        work.setStep(HighAvailabilityManager.Step.Cancelled);
        
        update(work, sc);
    }

    @Override
    public List<HaWorkVO> findTakenWorkItems(WorkType type) {
    	SearchCriteria<HaWorkVO> sc = TakenWorkSearch.create();
    	sc.setParameters("type", type);
    	sc.setParameters("step", Step.Done, Step.Cancelled, Step.Error);
    	
    	return listBy(sc);
    }
    
    
    @Override
    public boolean delete(long instanceId, WorkType type) {
    	SearchCriteria<HaWorkVO> sc = PreviousWorkSearch.create();
    	sc.setParameters("instance", instanceId);
    	sc.setParameters("type", type);
    	return expunge(sc) > 0;
    }
    
    @Override
    public boolean hasBeenScheduled(long instanceId, WorkType type) {
    	SearchCriteria<HaWorkVO> sc = PreviousWorkSearch.create();
    	sc.setParameters("instance", instanceId);
    	sc.setParameters("type", type);
    	return listBy(sc, null).size() > 0;
    }
    
    @Override
    public int releaseWorkItems(long nodeId) {
        SearchCriteria<HaWorkVO> sc = ReleaseSearch.create();
        sc.setParameters("server", nodeId);
        sc.setParameters("step", Step.Done, Step.Cancelled, Step.Error);
        
        HaWorkVO vo = createForUpdate();
        vo.setDateTaken(null);
        vo.setServerId(null);
        
        return update(vo, sc);
    }
}