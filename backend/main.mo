import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";

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

  public query func searchBusinessCards(searchText: Text) : async [BusinessCard] {
    let lowercaseQuery = Text.toLowercase(searchText);
    Array.filter(cards, func (card: BusinessCard) : Bool {
      Text.contains(Text.toLowercase(card.name), #text lowercaseQuery) or
      Text.contains(Text.toLowercase(card.email), #text lowercaseQuery) or
      Text.contains(Text.toLowercase(card.phone), #text lowercaseQuery) or
      Text.contains(Text.toLowercase(card.company), #text lowercaseQuery) or
      Text.contains(Text.toLowercase(card.category), #text lowercaseQuery) or
      Text.contains(Int.toText(card.scanDate), #text lowercaseQuery)
    })
  };
}
