# Copyright (C) 2011 Citrix Systems, Inc.  All rights reserved
#     
# This software is licensed under the GNU General Public License v3 or later.
# 
# It is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or any later version.
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
INSERT INTO `cloud`.`vm_template` (id, unique_name, name, public, created, type, hvm, bits, account_id, url, checksum, display_text, enable_password, format, guest_os_id, featured, cross_zones)
    VALUES (1, 'routing', 'DomR Template', 0, now(), 'ext3', 0, 64, 1, 'http://download.cloud.com/templates/builtin/a88232bf-6a18-38e7-aeee-c1702725079f.qcow2.bz2', 'e39c55e93ae96bd43bfd588ca6ee3269', 'DomR Template', 0, 'QCOW2', 21, 0, 1);
INSERT INTO `cloud`.`vm_template` (id, unique_name, name, public, created, type, hvm, bits, account_id, url, checksum, display_text, enable_password, format, guest_os_id, featured, cross_zones)
    VALUES (2, 'centos55-x86_64', 'CentOS 5.5(x86_64) no GUI', 1, now(), 'ext3', 0, 64, 1, 'http://download.cloud.com/templates/builtin/eec2209b-9875-3c8d-92be-c001bd8a0faf.qcow2.bz2', '1da20ae69b54f761f3f733dce97adcc0', 'CentOS 5.5(x86_64) no GUI', 0, 'QCOW2', 9, 1, 1);

INSERT INTO `cloud`.`guest_os_category` (id, name) VALUES (1, 'CentOS');
INSERT INTO `cloud`.`guest_os_category` (id, name) VALUES (2, 'Ubuntu');
INSERT INTO `cloud`.`guest_os_category` (id, name) VALUES (5, 'RedHat');
INSERT INTO `cloud`.`guest_os_category` (id, name) VALUES (7, 'Windows');
INSERT INTO `cloud`.`guest_os_category` (id, name) VALUES (8, 'Other');

INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 4.5', 'CentOS 4.5');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 4.6', 'CentOS 4.6');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 4.7', 'CentOS 4.7');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.0', 'CentOS 5.0');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.1', 'CentOS 5.1');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.2', 'CentOS 5.2');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.3', 'CentOS 5.3');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.4', 'CentOS 5.4');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (1, 'CentOS 5.5', 'CentOS 5.5');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 4.5', 'Red Hat Enterprise Linux 4.5');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 4.6', 'Red Hat Enterprise Linux 4.6');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 4.7', 'Red Hat Enterprise Linux 4.7');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.0', 'Red Hat Enterprise Linux 5.0');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.1', 'Red Hat Enterprise Linux 5.1');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.2', 'Red Hat Enterprise Linux 5.2');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.3', 'Red Hat Enterprise Linux 5.3');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.4', 'Red Hat Enterprise Linux 5.4');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 5.5', 'Red Hat Enterprise Linux 5.5');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Red Hat Enterprise Linux 6', 'Red Hat Enterprise Linux 6');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 13', 'Fedora 13');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 12', 'Fedora 12');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 11', 'Fedora 11');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 10', 'Fedora 10');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 9', 'Fedora 9');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (5, 'Fedora 8', 'Fedora 8');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Ubuntu 10.04', 'Ubuntu 10.04');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Ubuntu 9.10', 'Ubuntu 9.10');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Ubuntu 9.04', 'Ubuntu 9.04');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Ubuntu 8.10', 'Ubuntu 8.10');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Ubuntu 8.04', 'Ubuntu 8.04');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Debian Squeeze', 'Debian Squeeze');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Debian Lenny', 'Debian Lenny');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (2, 'Debian Etch', 'Debian Etch');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows 7', 'Windows 7');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows Server 2003', 'Windows Server 2003');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows Server 2008', 'Windows Server 2008');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows 2000 SP4', 'Windows 2000 SP4');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows Vista', 'Windows Vista');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows XP SP2', 'Windows XP SP2');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (7, 'Windows XP SP3', 'Windows XP SP3');
INSERT INTO `cloud`.`guest_os` (category_id, name, display_name) VALUES (8, 'Other install media', 'Other');

