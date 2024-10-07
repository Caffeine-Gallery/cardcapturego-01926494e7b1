import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

actor BusinessCardScanner {
  type BusinessCard = {
    id: Nat;
    name: Text;
    email: Text;
    phone: Text;
    company: Text;
    imageData: Text;
  };

  stable var cards : [BusinessCard] = [];
  stable var nextId : Nat = 0;

  public func addBusinessCard(name: Text, email: Text, phone: Text, company: Text, imageData: Text) : async Nat {
    let id = nextId;
    nextId += 1;

    let newCard : BusinessCard = {
      id;
      name;
      email;
      phone;
      company;
      imageData;
    };

    cards := Array.append(cards, [newCard]);
    id
  };

  public query func getBusinessCards() : async [BusinessCard] {
    cards
  };
}
