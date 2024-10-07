import Bool "mo:base/Bool";
import Hash "mo:base/Hash";
import Int "mo:base/Int";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

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

  public query func getCategories() : async [Text] {
    let categorySet = HashMap.HashMap<Text, Bool>(10, Text.equal, Text.hash);
    for (card in cards.vals()) {
      categorySet.put(card.category, true);
    };
    Iter.toArray(categorySet.keys())
  };
}
