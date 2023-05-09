﻿// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {Getter} from '@loopback/context';
import {inject} from '@loopback/core';
import {IAuthUserWithPermissions} from '@sourceloop/core';
import {AuthenticationBindings} from 'loopback4-authentication';

import {DefaultCrudRepository, juggler, repository} from '@loopback/repository';
import {
  ConditionalAuditRepositoryMixin,
  IAuditMixinOptions,
} from '@sourceloop/audit-log';
import {UserTenantDataSourceName} from '../keys';
import {UserView} from '../models';
import {AuditLogRepository} from './audit.repository';

const NonRestrictedUserViewAuditOpts: IAuditMixinOptions = {
  actionKey: 'Non_Restricted_User_View_Logs',
};

export class NonRestrictedUserViewRepository extends ConditionalAuditRepositoryMixin(
  DefaultCrudRepository<UserView, typeof UserView.prototype.id>,
  NonRestrictedUserViewAuditOpts,
) {
  constructor(
    @inject(`datasources.${UserTenantDataSourceName}`)
    dataSource: juggler.DataSource,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    protected readonly getCurrentUser: Getter<
      IAuthUserWithPermissions | undefined
    >,
    @repository.getter('AuditLogRepository')
    public getAuditLogRepository: Getter<AuditLogRepository>,
  ) {
    super(UserView, dataSource);
  }
}
