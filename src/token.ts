export const TokenABI = `
@compiler >= 4

include "Option.aes"
include "String.aes"

/// @title - Fungible token with all the extensions - burn, mint, allowances
contract FungibleTokenFull =

  // This defines the state of type record encapsulating the contract's mutable state
  record state =
    { owner        : address      // the smart contract's owner address
    , total_supply : int          // total token supply
    , balances     : balances     // balances for each account
    , meta_info    : meta_info    // token meta info (name, symbol, decimals)
    , allowances   : allowances   // owner of account approves the transfer of an amount to another account
    , swapped      : map(address, int) }

  // This is the meta-information record type
  record meta_info =
    { name     : string
    , symbol   : string
    , decimals : int }

  // This is the format of allowance record type that will be used in the state
  record allowance_accounts = { from_account : address, for_account : address }

  // This is a type alias for the balances map
  type balances = map(address, int)

  // This is a type alias for the allowances map
  type allowances = map(allowance_accounts, int)

  // Declaration and structure of datatype event
  // and events that will be emitted on changes
  datatype event =
    Transfer(address, address, int)
    | Allowance(address, address, int)
    | Burn(address, int)
    | Mint(address, int)
    | Swap(address, int)

  // List of supported extensions
  entrypoint aex9_extensions() : list(string) = ["allowances", "mintable", "burnable", "swappable"]

  entrypoint init(name: string, decimals : int, symbol : string, initial_owner_balance : option(int)) =

    require(String.length(name) >= 1, "STRING_TOO_SHORT_NAME")

    require(String.length(symbol) >= 1, "STRING_TOO_SHORT_SYMBOL")

    require_non_negative_value(decimals)
    // If negative initial owner balance is passed, abort the execution
    let initial_supply = Option.default(0, initial_owner_balance)
    require_non_negative_value(initial_supply)

    let owner = Call.caller
    { owner        = owner,
      total_supply = initial_supply,
      balances     = Option.match({}, (balance) => { [owner] = balance }, initial_owner_balance),
      meta_info    = { name = name, symbol = symbol, decimals = decimals },
      allowances   = {},
      swapped      = {} }

  // Get the token meta info
  entrypoint meta_info() : meta_info =
    state.meta_info

  // Get the token total supply
  entrypoint total_supply() : int =
    state.total_supply

  // Get the token owner address
  entrypoint owner() : address =
    state.owner

  // Get the balances state
  entrypoint balances() : balances =
    state.balances

  entrypoint balance(account: address) : option(int) =
    Map.lookup(account, state.balances)

  // Get all swapped tokens stored in state
  entrypoint swapped() : map(address, int) =
    state.swapped

  // Get the allowances state
  entrypoint allowances() : allowances =
    state.allowances

  entrypoint allowance(allowance_accounts : allowance_accounts) : option(int) =
    Map.lookup(allowance_accounts, state.allowances)

  entrypoint allowance_for_caller(from_account: address) : option(int) =
    allowance({ from_account = from_account, for_account = Call.caller })

  stateful entrypoint transfer_allowance(from_account: address, to_account: address, value: int) =
    let allowance_accounts = { from_account = from_account, for_account = Call.caller }
    internal_transfer(from_account, to_account, value)
    internal_change_allowance(allowance_accounts, -value)

  stateful entrypoint create_allowance(for_account: address, value: int) =
    // Check if the passed value is not negative
    require_non_negative_value(value)
    // Set the allowance account pair in the memory variable
    let allowance_accounts = { from_account =  Call.caller, for_account = for_account }
    // Check if there is no allowance already present in the state
    // for these particular accounts pair.
    require_allowance_not_existent(allowance_accounts)
    // Save the allowance value for these accounts pair in the state
    put(state{ allowances[allowance_accounts] = value })
    // Fire Allowance event to include it in the transaction event log
    Chain.event(Allowance(Call.caller, for_account, value))

  stateful entrypoint change_allowance(for_account: address, value_change: int) =
    let allowance_accounts = { from_account =  Call.caller, for_account = for_account }
    internal_change_allowance(allowance_accounts, value_change)

  stateful entrypoint reset_allowance(for_account: address) =
    let allowance_accounts = { from_account = Call.caller, for_account = for_account }
    internal_change_allowance(allowance_accounts, - state.allowances[allowance_accounts])

  stateful entrypoint transfer(to_account: address, value: int) =
    internal_transfer(Call.caller, to_account, value)

  stateful entrypoint burn(value: int) =
    require_balance(Call.caller, value)
    require_non_negative_value(value)
    put(state{ total_supply = state.total_supply - value, balances[Call.caller] @ b = b - value })
    Chain.event(Burn(Call.caller, value))

  stateful entrypoint mint(account: address, value: int) =
    require_owner()
    require_non_negative_value(value)
    put(state{ total_supply = state.total_supply + value, balances[account = 0] @ b = b + value })
    Chain.event(Mint(account, value))

  stateful entrypoint swap() =
    let balance = Map.lookup_default(Call.caller, state.balances, 0)
    burn(balance)
    put(state{ swapped[Call.caller] = balance })
    Chain.event(Swap(Call.caller, balance))

  stateful entrypoint check_swap(account: address) : int =
    Map.lookup_default(account, state.swapped, 0)

  // INTERNAL FUNCTIONS

  function require_owner() =
    require(Call.caller == state.owner, "ONLY_OWNER_CALL_ALLOWED")

  function require_non_negative_value(value : int) =
    require(value >= 0, "NON_NEGATIVE_VALUE_REQUIRED")

  function require_balance(account : address, value : int) =
    switch(balance(account))
      Some(balance) =>
        require(balance >= value, "ACCOUNT_INSUFFICIENT_BALANCE")
      None => abort("BALANCE_ACCOUNT_NOT_EXISTENT")

  stateful function internal_transfer(from_account: address, to_account: address, value: int) =
    require_non_negative_value(value)
    require_balance(from_account, value)
    put(state{ balances[from_account] @ b = b - value })
    put(state{ balances[to_account = 0] @ b = b + value })
    Chain.event(Transfer(from_account, to_account, value))

  function require_allowance_not_existent(allowance_accounts : allowance_accounts) =
    switch(allowance(allowance_accounts))
      None => None
      Some(_) => abort("ALLOWANCE_ALREADY_EXISTENT")

  function require_allowance(allowance_accounts : allowance_accounts, value : int) : int =
    switch(allowance(allowance_accounts))
      Some(allowance) =>
        require_non_negative_value(allowance + value)
        allowance
      None => abort("ALLOWANCE_NOT_EXISTENT")

  stateful function internal_change_allowance(allowance_accounts : allowance_accounts, value_change : int) =
    let allowance = require_allowance(allowance_accounts, value_change)
    let new_allowance = allowance + value_change
    require_non_negative_value(new_allowance)
    put(state{ allowances[allowance_accounts] = new_allowance })
    Chain.event(Allowance(allowance_accounts.from_account, allowance_accounts.for_account, new_allowance))

`;
