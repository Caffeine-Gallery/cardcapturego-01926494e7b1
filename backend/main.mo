import Int "mo:base/Int";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor BusinessCardScanner {
  type BusinessCard = {
    id: Nat;
    name: Text;
    email: Text;
    phone: Text;
    company: Text;
    imageData: Text;
    scanDate: Int;
    category: Text;
  };

  stable var cards : [BusinessCard] = [];
  stable var nextId : Nat = 0;

  public func addBusinessCard(name: Text, email: Text, phone: Text, company: Text, imageData: Text, category: Text) : async Nat {
    let id = nextId;
    nextId += 1;

    let newCard : BusinessCard = {
      id;
      name;
      email;
      phone;
      company;
      imageData;
      scanDate = Time.now();
      category;
    };

    cards := Array.append(cards, [newCard]);
    id
  };

  public query func getBusinessCards() : async [BusinessCard] {
    cards
  };
}
