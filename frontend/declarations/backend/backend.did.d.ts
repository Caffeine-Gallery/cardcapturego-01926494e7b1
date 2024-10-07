import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BusinessCard {
  'id' : bigint,
  'name' : string,
  'email' : string,
  'company' : string,
  'imageUrl' : string,
  'phone' : string,
}
export interface _SERVICE {
  'addBusinessCard' : ActorMethod<
    [string, string, string, string, string],
    bigint
  >,
  'getBusinessCards' : ActorMethod<[], Array<BusinessCard>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
