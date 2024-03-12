// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, Entity, repository} from '@loopback/repository';
import {SequelizeDataSource} from '@loopback/sequelize';
import {IAuthUserWithPermissions} from '@sourceloop/core';
import {SequelizeUserModifyCrudRepository} from '@sourceloop/core/sequelize';
import {AuthenticationBindings} from 'loopback4-authentication';
import {UserTenantDataSourceName} from '../../keys';
import {UserTenant, UserTenantPrefs} from '../../models';
import {UserTenantRepository} from './user-tenant.repository';

export class UserTenantPrefsRepository extends SequelizeUserModifyCrudRepository<
  UserTenantPrefs,
  typeof UserTenantPrefs.prototype.id
> {
  public readonly userTenant: BelongsToAccessor<
    UserTenant,
    typeof UserTenantPrefs.prototype.id
  >;

  constructor(
    @inject(`datasources.${UserTenantDataSourceName}`)
    dataSource: SequelizeDataSource,
    @repository.getter('UserTenantRepository')
    protected userTenantRepositoryGetter: Getter<UserTenantRepository>,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    protected readonly getCurrentUser: Getter<
      IAuthUserWithPermissions | undefined
    >,
    @inject('models.UserTenantPrefs')
    private readonly userTenantPrefs: typeof Entity & {
      prototype: UserTenantPrefs;
    },
  ) {
    super(userTenantPrefs, dataSource, getCurrentUser);
    this.userTenant = this.createBelongsToAccessorFor(
      'userTenant',
      userTenantRepositoryGetter,
    );
    this.registerInclusionResolver(
      'userTenant',
      this.userTenant.inclusionResolver,
    );
  }
}
