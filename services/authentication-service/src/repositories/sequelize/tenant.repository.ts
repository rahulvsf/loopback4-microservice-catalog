﻿// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {Getter, inject} from '@loopback/core';
import {
  Entity,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';

import {SequelizeDataSource} from '@loopback/sequelize';
import {SequelizeSoftCrudRepository} from 'loopback4-soft-delete/sequelize';
import {Tenant, TenantConfig} from '../../models';
import {AuthDbSourceName} from '../../types';
import {TenantConfigRepository} from './tenant-config.repository';

export class TenantRepository extends SequelizeSoftCrudRepository<
  Tenant,
  typeof Tenant.prototype.id
> {
  public readonly tenantConfigs: HasManyRepositoryFactory<
    TenantConfig,
    typeof Tenant.prototype.id
  >;

  constructor(
    @inject(`datasources.${AuthDbSourceName}`) dataSource: SequelizeDataSource,
    @repository.getter('TenantConfigRepository')
    protected tenantConfigRepositoryGetter: Getter<TenantConfigRepository>,
    @inject('models.Tenant')
    private readonly tenant: typeof Entity & {prototype: Tenant},
  ) {
    super(tenant, dataSource);
    this.tenantConfigs = this.createHasManyRepositoryFactoryFor(
      'tenantConfigs',
      tenantConfigRepositoryGetter,
    );
    this.registerInclusionResolver(
      'tenantConfigs',
      this.tenantConfigs.inclusionResolver,
    );
  }
}
