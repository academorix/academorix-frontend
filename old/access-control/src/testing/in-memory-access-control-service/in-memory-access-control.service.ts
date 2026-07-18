/**
 * @file in-memory-access-control.service.ts
 * @module @academorix/access-control/testing/in-memory-access-control-service
 *
 * @description
 * `IAccessControlService` implementation backed by in-memory
 * arrays. Consumer tests rebind the `ACCESS_CONTROL_SERVICE`
 * token to this class — every downstream hook resolves against
 * the in-memory store, no HTTP, deterministic.
 */

import { Injectable } from "@academorix/container";

import type { AssignRoleInputSchema } from "../../schemas/assign-role-input.schema";
import type { CreatePermissionInputSchema } from "../../schemas/create-permission-input.schema";
import type { CreateRoleInputSchema } from "../../schemas/create-role-input.schema";
import type { SyncRolePermissionsInputSchema } from "../../schemas/sync-role-permissions-input.schema";
import type { UpdatePermissionInputSchema } from "../../schemas/update-permission-input.schema";
import type { UpdateRoleInputSchema } from "../../schemas/update-role-input.schema";
import type {
  IAccessControlService,
  ICanRequest,
  ICanResponse,
  IMePayload,
} from "@academorix/contracts";
import type { IAbilityData } from "@academorix/contracts";
import type { IPermissionData } from "@academorix/contracts";
import type { IRoleAssignmentData } from "@academorix/contracts";
import type { IRoleData } from "@academorix/contracts";

/**
 * Seed for the in-memory service.
 */
export interface IInMemoryAccessControlSeed {
  readonly permissions?: readonly IPermissionData[];
  readonly roles?: readonly IRoleData[];
  readonly abilities?: readonly IAbilityData[];
  /** Names of permissions the current user holds. */
  readonly userPermissions?: readonly string[];
  /** Names of roles the current user holds. */
  readonly userRoles?: readonly string[];
  /**
   * Optional predicate that decides `can()` responses. When
   * omitted, `can()` returns true when the action name matches
   * a permission the user holds.
   */
  readonly canPredicate?: (input: ICanRequest) => ICanResponse;
}

let nextId = 0;
function id(prefix: string): string {
  nextId += 1;
  return `${prefix}_${nextId.toString(36).padStart(20, "0").toUpperCase()}`;
}

/**
 * In-memory access-control service — swap-in double for tests.
 *
 * @category Testing
 */
@Injectable()
export class InMemoryAccessControlService implements IAccessControlService {
  private permissions: IPermissionData[];
  private roles: IRoleData[];
  private abilities: IAbilityData[];
  private userPermissions: string[];
  private userRoles: string[];
  private canPredicate: ((input: ICanRequest) => ICanResponse) | undefined;
  private assignments: IRoleAssignmentData[] = [];

  public constructor(seed?: IInMemoryAccessControlSeed) {
    this.permissions = seed?.permissions ? [...seed.permissions] : [];
    this.roles = seed?.roles ? [...seed.roles] : [];
    this.abilities = seed?.abilities ? [...seed.abilities] : [];
    this.userPermissions = seed?.userPermissions ? [...seed.userPermissions] : [];
    this.userRoles = seed?.userRoles ? [...seed.userRoles] : [];
    this.canPredicate = seed?.canPredicate;
  }

  // ---------------------- ability checks ----------------------

  /** {@inheritDoc IAccessControlService.can} */
  public async can(input: ICanRequest): Promise<ICanResponse> {
    if (this.canPredicate) return this.canPredicate(input);
    const can = this.userPermissions.includes(input.action);
    return { can, reason: can ? undefined : `Missing permission: ${input.action}` };
  }

  /** {@inheritDoc IAccessControlService.listMyAbilities} */
  public async listMyAbilities(): Promise<readonly IAbilityData[]> {
    return [...this.abilities];
  }

  /** {@inheritDoc IAccessControlService.fetchBootPayload} */
  public async fetchBootPayload(): Promise<IMePayload> {
    return {
      permissions: [...this.userPermissions],
      roles: [...this.userRoles],
      abilities: [...this.abilities],
    };
  }

  // ---------------------- permission CRUD ----------------------

  public async listPermissions(): Promise<readonly IPermissionData[]> {
    return [...this.permissions];
  }
  public async showPermission(pid: string): Promise<IPermissionData> {
    const found = this.permissions.find((p) => p.id === pid);
    if (!found) throw new Error(`Permission ${pid} not found`);
    return found;
  }
  public async createPermission(input: CreatePermissionInputSchema): Promise<IPermissionData> {
    const record: IPermissionData = {
      id: id("perm"),
      name: input.name,
      label: input.label,
      description: input.description ?? null,
      guard: input.guard,
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.permissions = [...this.permissions, record];
    return record;
  }
  public async updatePermission(
    pid: string,
    input: UpdatePermissionInputSchema,
  ): Promise<IPermissionData> {
    const idx = this.permissions.findIndex((p) => p.id === pid);
    if (idx === -1) throw new Error(`Permission ${pid} not found`);
    const updated: IPermissionData = {
      ...this.permissions[idx]!,
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.permissions = [
      ...this.permissions.slice(0, idx),
      updated,
      ...this.permissions.slice(idx + 1),
    ];
    return updated;
  }

  // ---------------------- role CRUD ----------------------

  public async listRoles(): Promise<readonly IRoleData[]> {
    return [...this.roles];
  }
  public async showRole(rid: string): Promise<IRoleData> {
    const found = this.roles.find((r) => r.id === rid);
    if (!found) throw new Error(`Role ${rid} not found`);
    return found;
  }
  public async createRole(input: CreateRoleInputSchema): Promise<IRoleData> {
    const permissions = (input.permissions ?? [])
      .map((name) => this.permissions.find((p) => p.name === name))
      .filter((p): p is IPermissionData => p !== undefined);
    const record: IRoleData = {
      id: id("role"),
      name: input.name,
      label: input.label,
      description: input.description ?? null,
      guard: input.guard,
      isSystem: false,
      permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.roles = [...this.roles, record];
    return record;
  }
  public async updateRole(rid: string, input: UpdateRoleInputSchema): Promise<IRoleData> {
    const idx = this.roles.findIndex((r) => r.id === rid);
    if (idx === -1) throw new Error(`Role ${rid} not found`);
    const updated: IRoleData = {
      ...this.roles[idx]!,
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.roles = [...this.roles.slice(0, idx), updated, ...this.roles.slice(idx + 1)];
    return updated;
  }
  public async deleteRole(rid: string): Promise<void> {
    this.roles = this.roles.filter((r) => r.id !== rid);
  }

  // ---------------------- sync + assign ----------------------

  public async syncRolePermissions(
    roleId: string,
    input: SyncRolePermissionsInputSchema,
  ): Promise<IRoleData> {
    const idx = this.roles.findIndex((r) => r.id === roleId);
    if (idx === -1) throw new Error(`Role ${roleId} not found`);
    const permissions = input.permissions
      .map((name) => this.permissions.find((p) => p.name === name))
      .filter((p): p is IPermissionData => p !== undefined);
    const updated: IRoleData = {
      ...this.roles[idx]!,
      permissions,
      updatedAt: new Date().toISOString(),
    };
    this.roles = [...this.roles.slice(0, idx), updated, ...this.roles.slice(idx + 1)];
    return updated;
  }

  public async assignRole(
    userId: string,
    input: AssignRoleInputSchema,
  ): Promise<IRoleAssignmentData> {
    const role = this.roles.find((r) => r.id === input.roleId);
    if (!role) throw new Error(`Role ${input.roleId} not found`);
    const assignment: IRoleAssignmentData = {
      userId,
      roleId: role.id,
      roleName: role.name,
      assignedAt: new Date().toISOString(),
      assignedBy: null,
    };
    this.assignments = [...this.assignments, assignment];
    return assignment;
  }

  public async revokeRole(userId: string, roleId: string): Promise<void> {
    this.assignments = this.assignments.filter(
      (a) => !(a.userId === userId && a.roleId === roleId),
    );
  }
}
