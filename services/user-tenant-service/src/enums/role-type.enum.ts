﻿// Copyright (c) 2023 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {RoleTypes} from '@sourceloop/core';

export const enum RoleKey {
  Admin = 0,
  Default = 2,
  ProgramManager = 3,
  GuestBoardViewer = 4,
  GuestDashboardViewer = 5,
  Automation = 7,
  GuestTaskViewer = 8,
  GuestGroupViewer = 9,
  SuperAdmin = 10,
  GuestWorkspaceViewer = 11,
}
export type RoleType = RoleKey & RoleTypes;

export const DisallowedRoles = [RoleTypes.Others];

export interface RoleTypeMapValue {
  permissionKey: string;
  value: number;
}
export const RoleTypeMap: {
  [key in keyof RoleType]: RoleTypeMapValue;
} = {
  [RoleTypes.Admin]: {
    permissionKey: 'PlatformAdmin',
    value: RoleTypes.Admin,
  },
  [RoleKey.Default]: {
    permissionKey: 'Default',
    value: RoleKey.Default,
  },
  [RoleKey.ProgramManager]: {
    permissionKey: 'ProgramManager',
    value: RoleKey.ProgramManager,
  },
  [RoleKey.GuestBoardViewer]: {
    permissionKey: 'GuestBoardViewer',
    value: RoleKey.GuestBoardViewer,
  },
  [RoleKey.GuestDashboardViewer]: {
    permissionKey: 'GuestDashboardViewer',
    value: RoleKey.GuestDashboardViewer,
  },
  [RoleKey.GuestGroupViewer]: {
    permissionKey: 'GuestGroupViewer',
    value: RoleKey.GuestGroupViewer,
  },
  [RoleKey.GuestTaskViewer]: {
    permissionKey: 'GuestTaskViewer',
    value: RoleKey.GuestTaskViewer,
  },
  [RoleKey.SuperAdmin]: {
    permissionKey: 'SuperAdmin',
    value: RoleKey.SuperAdmin,
  },
  [RoleKey.GuestWorkspaceViewer]: {
    permissionKey: 'GuestWorkspaceViewer',
    value: RoleKey.GuestWorkspaceViewer,
  },
};
