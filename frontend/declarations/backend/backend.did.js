export const idlFactory = ({ IDL }) => {
  const BusinessCard = IDL.Record({
    'id' : IDL.Nat,
    'scanDate' : IDL.Int,
    'imageData' : IDL.Text,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'company' : IDL.Text,
    'category' : IDL.Text,
    'phone' : IDL.Text,
  });
  return IDL.Service({
    'addBusinessCard' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Nat],
        [],
      ),
    'getBusinessCards' : IDL.Func([], [IDL.Vec(BusinessCard)], ['query']),
    'getCategories' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
