import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BusinessCard {
  'id' : bigint,
  'scanDate' : bigint,
  'imageData' : string,
  'name' : string,
  'email' : string,
  'company' : string,
  'category' : string,
  'phone' : string,
}
export interface _SERVICE {
  'addBusinessCard' : ActorMethod<
    [string, string, string, string, string, string],
    bigint
  >,
  'getBusinessCards' : ActorMethod<[], Array<BusinessCard>>,
  'getCategories' : ActorMethod<[], Array<string>>,
  'searchBusinessCards' : ActorMethod<[string], Array<BusinessCard>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
