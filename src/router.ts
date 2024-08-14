export const RouterABI = `
@compiler >= 6
include "List.aes"
include "Option.aes"
contract interface IAedexV2FactoryForPair =
    entrypoint fee_to: () => option(address)

contract interface IAedexV2Callback =

    // To be called from swap after token transfers are made.
    // After this call the AedexV2Pair instance will make proper verifications to validate
    // or to invalidate the transaction.
    // Also the caller can make such invalidation during this call
    // The amount0 and amount1 represent the amounts of token0 and token1 transfered
    // to the sender's address
    entrypoint aedex_v2_call: (address /*sender*/, int /*amount0*/, int /*amount1*/) => unit


contract interface IWAE =
    payable stateful entrypoint deposit_to: (address) => unit
    payable stateful entrypoint deposit: () => unit
    stateful entrypoint transfer: (address /*to*/,  int /*value*/) => unit
    stateful entrypoint withdraw: (int /*amount: uint*/) => unit

contract interface IAEX9Minimal =
    record allowance_accounts = { from_account: address, for_account: address }

    record meta_info = { name : string , symbol : string , decimals : int }

    datatype event
        // AEX9 compliant events
        = Transfer(address /*indexed from*/, address /*indexed to*/, int /*value*/)
        | Approval(address /*indexed owner*/, address /*indexed spender*/, int /*value*/)
        | Allowance(address /*indexed owner*/, address /*indexed spender*/, int /*value*/)
        | Mint(address /*indexed owner*/, int /*value*/)
        | Burn(address /*indexed owner*/, int /*value*/)
        // For WAE
        | Deposit(address /*indexed dst*/, int /*ae*/)
        | Withdrawal(address /*indexed src*/, int /*amount*/)

    //This function returns meta information associated with the token contract.
    entrypoint meta_info: () => meta_info

    //This function returns the total token supply.
    entrypoint total_supply: () => int

    //This function returns the account balance of another account with address owner,
    //if the account exists. If the owner address is unknown to the contract None will be returned.
    //Using option type as a return value allows us to determine if the account has balance of 0, more than 0,=> unit
    //or the account has never had balance and is still unknown to the contract.
    entrypoint balance: (address) => option(int)

    //This function returns the amount which for_account is still allowed to withdraw from from_account,
    //where record allowance_accounts = { from_account: address, for_account: address }.
    //If no allowance for this combination of accounts exists, None is returned.
    entrypoint allowance: (allowance_accounts) => option(int)

    // This function allows transfer of value amount of tokens to to_account address and MUST fire the Transfer event.
    // The function SHOULD abort if the Call.caller's account balance does not have enough tokens to spend.
    // Note: Transfers of 0 values MUST be treated as normal transfers and fire the Transfer event.
    // @param to_account The account that will receive the amount transferred
    // @param value The number of tokens to send from the sender to the recipient
    stateful entrypoint transfer: (address /*to_account*/, int /*value*/) => unit


    // Allows for_account to withdraw from your account multiple times, up to the value amount.
    // If this function is called again it overwrites the current allowance with value.
    // Note: To prevent attack vectors (like the ones possible in ERC20) clients SHOULD make sure to create user interfaces in such a way that they set the allowance first to 0 before setting it to another value for the same spender. THOUGH the contract itself shouldn't enforce it, to allow backwards compatibility with contracts deployed before.
    // @notice Sets the allowance of a spender from the  Call.caller  to the value  amount 
    // @param spender The account which will be allowed to spend a given amount of the owners tokens
    // @param amount The amount of tokens allowed to be used by  spender 
    stateful entrypoint create_allowance: (address /*spender*/, int /*amount*/) => unit


    // Transfers value amount of tokens from address from_account to address to_account, and MUST fire the Transfer event.
    // The transfer_allowance method is used for a withdraw workflow, allowing contracts to transfer
    // tokens on your behalf. This can be used for example to allow a contract to transfer tokens on your behalf
    // and/or to charge fees in sub-currencies. The function SHOULD abort unless the from_account account has deliberately authorized the sender of the message via some mechanism.
    // Note: Transfers of 0 values MUST be treated as normal transfers and fire the Transfer event.
    // @notice Transfers  amount  tokens from  sender  to  recipient  up to the allowance given to the  Call.caller 
    // @param sender The account from which the transfer will be initiated
    // @param recipient The recipient of the transfer
    // @param amount The amount of the transfer
    stateful entrypoint transfer_allowance: ( address /*sender*/, address /*recipient*/, int /*amount*/) => unit

contract interface IAedexV2Pair =
    entrypoint balance: (address) => option(int)

    datatype event
        // AedexV2Pair specific events
        = LockLiquidity(int)
        | PairMint(address /*indexed sender*/, int /*amount0*/, int /*amount1*/)
        | PairBurn(address /*indexed sender*/, address /*indexed to*/, string /*int amount0 | int amount1*/ )
        | SwapTokens(
            address /*indexed sender*/
            , address /*indexed to*/
            , string
            /*
            , int amount0_in,
            , int amount1_in,
            , int amount0_out,
            , int amount1_out,
            */
        )
        //represents the new pair balances of token0 and token1
        | Sync(int /*reserve0*/, int /*reserve1*/)
    entrypoint init : (
          IAedexV2FactoryForPair
        , IAEX9Minimal
        , IAEX9Minimal
        , option(int)
        , option(int)
        ) => void

    entrypoint minimum_liquidity: () => int
    entrypoint factory: () => IAedexV2FactoryForPair
    entrypoint token0: () => IAEX9Minimal
    entrypoint token1: () => IAEX9Minimal

    record reserves = { reserve0: int , reserve1: int, blockTimestampLast: int }
    entrypoint price0_cumulative_last: () => int
    entrypoint price1_cumulative_last: () => int
    entrypoint k_last: () => int

    stateful entrypoint mint: (address) => int
    record amounts = { amount0: int, amount1: int }
    stateful entrypoint burn: (address /*to*/) => amounts

    stateful entrypoint swap: (
        int /*amount0Out*/
        , int /*amount1Out*/
        , address /*to*/
        , option(IAedexV2Callback) /*callback*/
        ) => unit

    stateful entrypoint skim: (address /*to*/) => unit
    stateful entrypoint sync: () => unit

    record reserves = {
              reserve0: int
            , reserve1: int
            , block_timestamp_last: int
            }

    entrypoint get_reserves: () => reserves

    //IEX9
    stateful entrypoint transfer_allowance: ( address /*sender*/, address /*recipient*/, int /*amount*/) => unit


contract interface IAedexV2Factory =
    entrypoint fee_to: () => option(address)
    entrypoint fee_to_setter: () => address

    entrypoint get_pair: (IAEX9Minimal /*tokenA*/, IAEX9Minimal /*tokenB*/) => option(IAedexV2Pair)
    entrypoint get_nth_pair: (int /*index*/) => IAedexV2Pair
    entrypoint all_pairs_length: () => int
    entrypoint get_all_pairs: () => list(IAedexV2Pair)

    stateful entrypoint create_pair: (
              IAEX9Minimal    // tokenA
            , IAEX9Minimal    // tokenB
            , option(int)     // min_liquidity
            , option(int)     // debug_time
        ) => IAedexV2Pair     // pair

    entrypoint set_fee_to: (option(address)) => unit
    entrypoint set_fee_toSetter: (address) => unit

payable contract interface IAedexV2Router =

    type amountA = int
    type amountB = int
    type amountToken = int
    type amountAE = int
    type liquidity = int

    entrypoint balance: () => int
    entrypoint factory: () => IAedexV2Factory
    entrypoint wae: () => IWAE
    entrypoint wae_aex9: () => IAEX9Minimal

    // **** ADD LIQUIDITY ****

    stateful entrypoint add_liquidity: (
              /*tokenA: */ IAEX9Minimal
            , /*tokenB: */ IAEX9Minimal
            , /*amountADesired: */ int
            , /*amountBDesired: */ int
            , /*amountAMin: */ int
            , /*amountBMin: */ int
            , /*to: */ address
            , /*deadline: */ int
        ) => (amountA * amountB * liquidity)

    payable stateful entrypoint add_liquidity_ae: (
          /*token: */ IAEX9Minimal
        , /*amountTokenDesired: */ int
        , /*amountTokenMin: */ int
        , /*amountAEMin: */ int
        , /*to: */ address
        , /*deadline: */ int
        ) =>  (amountToken * amountAE * liquidity)

    // **** REMOVE LIQUIDITY ****
    stateful entrypoint remove_liquidity: (
              /*tokenA: */ IAEX9Minimal
            , /*tokenB: */ IAEX9Minimal
            , /*liquidity: */ int
            , /*amountAMin: */ int
            , /*amountBMin: */ int
            , /*to: */ address
            , /*deadline: */ int
        ) => (amountA * amountB)

    stateful entrypoint remove_liquidity_ae: (
              /*token: */ IAEX9Minimal
            , /*liquidity: */ int
            , /*amountTokenMin: */ int
            , /*amountAEMin: */ int
            , /*to: */ address
            , /*deadline: */ int
        ) => (amountToken * amountAE)

    // **** SWAP ****
    stateful entrypoint swap_exact_tokens_for_tokens: (
              /*amount_in: */ int
            , /*amount_out_min: */ int
            , /*path: */ list(IAEX9Minimal)
            , /*to: */ address
            , /*deadline: */ int
            , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    stateful entrypoint swap_tokens_for_exact_tokens: (
              /*amount_out: */ int
            , /*amount_in_max: */ int
            , /*path: */ list(IAEX9Minimal)
            , /*to: */ address
            , /*deadline: */ int
            , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    payable stateful entrypoint swap_exact_ae_for_tokens: (
              /*amount_out_min: */ int
            , /*path: */ list(IAEX9Minimal)
            , /*to: */ address
            , /*deadline: */ int
            , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    stateful entrypoint swap_tokens_for_exact_ae: (
              /*amount_out: */ int
            , /*amount_in_max: */ int
            , /*path: */ list(IAEX9Minimal)
            , /*to: */ address
            , /*deadline: */ int
            , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    stateful entrypoint swap_exact_tokens_for_ae: (
          /*amount_in: */ int
        , /*amount_out_min: */ int
        , /*path: */ list(IAEX9Minimal)
        , /*to: */ address
        , /*deadline: */ int
        , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    payable stateful entrypoint swap_ae_for_exact_tokens: (
              /*amount_out: */ int
            , /*path: */ list(IAEX9Minimal)
            , /*to: */ address
            , /*deadline: */ int
            , /*callback: */ option(IAedexV2Callback)
        ) => list(int)

    // **** LIB EXPOSURE ****
    entrypoint quote: (
              /*amountA: */ int
            , /*reserveA: */ int
            , /*reserveB: */ int
        ) => int

    entrypoint get_amount_out: (
              /*amount_in: */ int
            , /*reserve_in: */ int
            , /*reserve_out: */ int
        ) => int

    entrypoint get_amount_in: (
              /*amount_out: */ int
            , /*reserve_in: */ int
            , /*reserve_out: */ int
        ) => int

    entrypoint get_amounts_out: (
               /*factory: */ IAedexV2Factory
            , /*amount_in: */ int
            , /*path: */ list(IAEX9Minimal)
        ) => list(int)

    entrypoint get_amounts_in: (
              /*factory: */ IAedexV2Factory
            , /*amount_out: */ int
            , /*path: */ list(IAEX9Minimal)
        ) => list(int)

namespace AedexV2Library =

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sort_tokens(
          tokenA: IAEX9Minimal
        , tokenB: IAEX9Minimal
        ): (IAEX9Minimal*IAEX9Minimal) =
        require(tokenA.address != tokenB.address, "AedexV2Library: IDENTICAL_ADDRESSES")
        if(tokenA.address < tokenB.address)
            (tokenA, tokenB)
        else
            (tokenB, tokenA)


    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(amountA: int, reserveA: int, reserveB: int): int /*amountB*/ =
        require(amountA > 0, "AedexV2Library: INSUFFICIENT_AMOUNT")
        require(reserveA > 0 && reserveB > 0, "AedexV2Library: INSUFFICIENT_LIQUIDITY")
        amountA*reserveB / reserveA

    function pair_for(
          factory: IAedexV2Factory
        , tokenA: IAEX9Minimal
        , tokenB: IAEX9Minimal
        ): IAedexV2Pair =
        switch(factory.get_pair(tokenA, tokenB))
            Some(pair) => pair
            None => abort("AedexV2Library: NO_PAIR_FOUND")

    // fetches and sorts the reserves for a pair
    function get_reserves(
          factory: IAedexV2Factory
        , tokenA: IAEX9Minimal
        , tokenB: IAEX9Minimal
        ): (int /*reserveA*/ * int /*reserveB*/) =
        let (token0, _) = sort_tokens(tokenA, tokenB)
        let pair = pair_for(factory, tokenA, tokenB)
        let reserves_ret = pair.get_reserves()
        let (reserve0, reserve1) = (reserves_ret.reserve0, reserves_ret.reserve1)
        if( tokenA == token0)
            (reserve0, reserve1)
        else
            (reserve1, reserve0)

    private function apply_fee(amount: int): int= amount*997 // the fee is 0.3%

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function get_amount_out(
          amount_in: int
        , reserve_in: int
        , reserve_out: int
        ): int =
        require(amount_in > 0, "AedexV2Library: INSUFFICIENT_INPUT_AMOUNT")
        require(reserve_in > 0 && reserve_out > 0, "AedexV2Library: INSUFFICIENT_LIQUIDITY")
        let amount_in_with_fee = apply_fee(amount_in)
        let numerator = amount_in_with_fee*reserve_out
        let denominator = reserve_in*1000 + amount_in_with_fee
        numerator / denominator

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function get_amount_in(
          amount_out: int
        , reserve_in: int
        , reserve_out: int
        ): int =
        require(amount_out > 0, "AedexV2Library: INSUFFICIENT_OUTPUT_AMOUNT")
        require(reserve_in > 0 && reserve_out > 0, "AedexV2Library: INSUFFICIENT_LIQUIDITY")
        let numerator = reserve_in*amount_out*1000
        let denominator = apply_fee(reserve_out - amount_out)
        (numerator / denominator) + 1


    // performs chained get_amount_out calculations on any number of pairs
    function get_amounts_out(
          factory: IAedexV2Factory
        , amount_in: int
        , path: list(IAEX9Minimal)
        ): list(int) =
        require(List.length(path) >= 2, "AedexV2Library: INVALID_PATH")
        let amounts = amount_in::[]
        _get_amounts_out(factory, amounts, path)

    private function _get_amounts_out(
          factory: IAedexV2Factory
        , amounts: list(int)
        , path: list(IAEX9Minimal)
        ): list(int) = switch((path, amounts))
            (_::[], _) => List.reverse(amounts)
            (tokenA::tokenB::_path, prev_amount::_) =>
                let (reserve_in, reserve_out) = get_reserves(factory, tokenA, tokenB)
                let new_amount = get_amount_out(prev_amount, reserve_in, reserve_out)
                _get_amounts_out(factory, new_amount::amounts, tokenB::_path)
            (_, []) => abort("AedexV2Library: INTERNAL_ERROR_AMOUNTS_VOID")
            ([], _) => abort("AedexV2Library: INTERNAL_ERROR_PATH_VOID")

    // performs chained get_amount_in calculations on any number of pairs
    function get_amounts_in(
          factory: IAedexV2Factory
        , amount_out: int
        , path: list(IAEX9Minimal)
        ): list(int) =
        require(List.length(path) >= 2, "AedexV2Library: INVALID_PATH")
        let amounts = amount_out::[]
        _get_amounts_in(factory, amounts, List.reverse(path))

    private function _get_amounts_in(
          factory: IAedexV2Factory
        , amounts: list(int)
        , path: list(IAEX9Minimal)
        ): list(int) = switch((path, amounts))
            (_, []) => abort("AedexV2Library: INTERNAL_ERROR_AMOUNTS_VOID")
            ([], _) => abort("AedexV2Library: INTERNAL_ERROR_PATH_VOID")
            (_::[], _) => amounts
            (tokenB::tokenA::_path, prev_amount::_) =>
                let (reserve_in, reserve_out) = get_reserves(factory, tokenA, tokenB)
                let new_amount = get_amount_in(prev_amount, reserve_in, reserve_out)
                _get_amounts_in(factory, new_amount::amounts, tokenA::_path)



payable contract AedexV2Router =
    record state = {
              factory: IAedexV2Factory
            , wae: IWAE
            , wae_aex9: IAEX9Minimal
            }

    type amount_a = int
    type amount_b = int
    type amount_token = int
    type amount_ae = int
    type liquidity = int

    entrypoint init( factory: IAedexV2Factory, wae: IWAE, wae_aex9: IAEX9Minimal) =
        require(wae.address == wae_aex9.address, "AedexV2Router: DIFFERENT_WAE_ADDRESSES")
        {   factory  = factory
          , wae      = wae
          , wae_aex9 = wae_aex9
          }

    entrypoint balance() = Contract.balance

    entrypoint factory() = state.factory

    entrypoint wae() = state.wae

    entrypoint wae_aex9() = state.wae_aex9

    //NOTE(1):  deadline  parameter for all entrypoints represents the maximum
    // timestamp allowed for the transaction to take place. Since a delay might exists
    // between the user starts the entrypoint call and the actual mining of it
    // we ensure the the Pair.timestamp() is lower than provided deadline.
    // Otherwise the transaction will be aborted

    //------------------------------------------------------------------------------
    // ADD LIQUIDITY
    //------------------------------------------------------------------------------

    //creates the pair if it doesn't exists
    function ensure_pair_existence(
          token_a: IAEX9Minimal
        , token_b: IAEX9Minimal
        , min_liquidity: option(int)
        ) =
        let factory = state.factory
        // create the pair if it doesn't exists yet
        if( Option.is_none( factory.get_pair(token_a, token_b) ))
           factory.create_pair(token_a, token_b, min_liquidity, None)
           ()

    // calculates the amount based on parameters and pair reserves
    function compute_add_liquidity_amounts(
          token_a: IAEX9Minimal
        , token_b: IAEX9Minimal
        , amount_a_desired: int
        , amount_b_desired: int
        , amount_a_min: int
        , amount_b_min: int
        ): (amount_a *  amount_b) =
        let (reserve_a,reserve_b) = AedexV2Library.get_reserves( state.factory, token_a, token_b )

        if (reserve_a == 0 && reserve_b == 0)
            (amount_a_desired, amount_b_desired)
        else
            // there are provided two desired liquidity amounts, one  will remain fixed with
            // what was provided as desired, and the second one will be inferred based
            // on the current tokenA/tokenB rate.
            // If the inferred one is less than amount(A/B)Min
            // or greater then amount(A/B)Desired the transaction will fail.
            // First we will try to infer B from A, if that is less then B_Desired we go with that
            // otherwise we are going to infer A from B
            let amount_b_optimal = AedexV2Library.quote(amount_a_desired, reserve_a, reserve_b)
            if (amount_b_optimal =< amount_b_desired)
                require(amount_b_optimal >= amount_b_min, "AedexV2Router: INSUFFICIENT_B_AMOUNT")
                (amount_a_desired, amount_b_optimal)
            else
                let amount_a_optimal = AedexV2Library.quote(amount_b_desired, reserve_b, reserve_a)
                require(amount_a_optimal >= amount_a_min, "AedexV2Router: INSUFFICIENT_A_AMOUNT")
                (amount_a_optimal, amount_b_desired)

    // Adds liquidity for a certain Pair of regular AEX9 tokens.
    // If the Pair doesn't exists new one will be created and the min_liquidity
    // will be permanently locked.
    // Because the pair ratio of token_a and token_b reserves might change since the entrypoint call
    // to the actual transaction allocation moment, there are 2 indicators helping the Caller
    // to ensure the offered ratio remain within some given boundaries.
    // 1. The desired amounts:  representing the upper boundary for the token amounts to be provided
    // as liquidity
    // 2. The minimum amounts ensures no token amounts transfered as liquidity will be less than values specified.
    // In this way, we have an upper boundary (desired) and a lower boundary (min) for liquidity to be withdrawn
    // from the Caller's wallet
    // Usage:
    // Before calling add_liquidity the Caller needs to ensure enough allowance to the router exists
    // for both toke_a and token_b.
    // The return values represent the actual amounts of token_a and tokeb_b withdrawn from the Caller
    // and the minted pair tokens resulted during the adding liquidity process
    stateful entrypoint add_liquidity(
              token_a: IAEX9Minimal
            , token_b: IAEX9Minimal
            , amount_a_desired: int
            , amount_b_desired: int
            , amount_a_min: int
            , amount_b_min: int
            , to: address
            , min_liquidity: option(int) // the minimum liquidity constant for the pair
                                         // in case the pair is not yet created
                                         // see AedexV2Pair  init  description for more information
            , deadline: int
        ): (amount_a * amount_b * liquidity) =
        require_deadline(deadline)
        ensure_pair_existence(token_a, token_b, min_liquidity)
        let (amount_a, amount_b) = compute_add_liquidity_amounts(
                token_a, token_b,
                amount_a_desired, amount_b_desired,
                amount_a_min, amount_b_min
                )
        // Get the pair and transfer the tokens to its address
        let pair: IAedexV2Pair = AedexV2Library.pair_for( state.factory, token_a, token_b )
        token_a.transfer_allowance( Call.caller, pair.address, amount_a )
        token_b.transfer_allowance( Call.caller, pair.address, amount_b )
        let minted_liquidity = pair.mint(to)
        ( amount_a, amount_b, minted_liquidity )

    // Adds liquidity for a certain Pair of a regular AEX9 token and AE.
    // It behaves like  add_liquidity , but only one AEX9 token is involved, the orher one being the AE token.
    // The usage difference manly consist in creating allowance only for the regular AEX9 token,
    // and for AE being needed a regular AE transfer/payment attached to the current transaction.
    // The Router will pay back (refund) the difference between the actual AE payment and the
    // real amount of AE needed for adding the liquidity.
    // So, instead of ae_desired the AE payment takes the place for the upper boundary
    payable stateful entrypoint add_liquidity_ae(
          token: IAEX9Minimal
        , amount_token_desired: int
        , amount_token_min: int
        , amount_ae_min: int
        , to: address
        , min_liquidity: option(int) // the minimum liquidity constant for the pair
                                     // in case the pair is not yet created
                                     // see AedexV2Pair  init  description for more information
        , deadline: int
        ):  (amount_token * amount_ae * liquidity) =
        require_deadline(deadline)
        let wae_aex9 = state.wae_aex9
        ensure_pair_existence(token, wae_aex9, min_liquidity)
        let (amount_token, amount_ae) = compute_add_liquidity_amounts(
                token, wae_aex9,
                amount_token_desired, Call.value,
                amount_token_min, amount_ae_min
                )
        let pair: IAedexV2Pair = AedexV2Library.pair_for(state.factory, token, wae_aex9)
        token.transfer_allowance(Call.caller, pair.address, amount_token)

        state.wae.deposit_to(pair.address, value=amount_ae)
        let liquidity = pair.mint(to)
        if (Call.value > amount_ae)
            Chain.spend(Call.caller, Call.value - amount_ae) // refund dust ae, if any
        (amount_token, amount_ae, liquidity)

    //------------------------------------------------------------------------------
    // REMOVE LIQUIDITY
    //------------------------------------------------------------------------------

    // Removes Caller's provided liquidity from a pair of two AEX9 tokens (token_a and token_b)
    // Usage: before calling the entrypoint, the Caller has to create enough allowance of Pair tokens
    // towards the router's address
    // A lower boundary is provided in the form of amount_a_min and amount_b_min,
    // because the actual reserves might modify from the moment the Caller decided to remove the liquidity
    // and the actual moment of the transaction. 
    // If any of the resulted amount_a and amount_b will be lower than its correspondent boundary
    // the transaction will fail
    // At the end of the transaction, both tokens will be transfered to the Caller's wallet and
    // the liquidity will be burned from the Pair
    stateful entrypoint remove_liquidity(
              token_a: IAEX9Minimal
            , token_b: IAEX9Minimal
            , liquidity: int
            , amount_a_min: int
            , amount_b_min: int
            , to: address
            , deadline: int
        ): (amount_a * amount_b) =
        require_deadline(deadline)
        let pair: IAedexV2Pair = AedexV2Library.pair_for(state.factory, token_a, token_b)
        pair.transfer_allowance(Call.caller, pair.address, liquidity) // send liquidity to pair
        let burn_ret = pair.burn(to)
        let (token0, _) = AedexV2Library.sort_tokens(token_a, token_b)
        let (amount_a, amount_b) = if (token_a == token0) (burn_ret.amount0, burn_ret.amount1)
                                   else (burn_ret.amount1, burn_ret.amount0)
        require(amount_a >= amount_a_min, "AedexV2Router: INSUFFICIENT_A_AMOUNT")
        require(amount_b >= amount_b_min, "AedexV2Router: INSUFFICIENT_B_AMOUNT")
        (amount_a, amount_b)

    //Same as remove_liquidity, but one of the tokens being AE
    payable stateful entrypoint remove_liquidity_ae(
              token: IAEX9Minimal
            , liquidity: int
            , amount_token_min: int
            , amount_ae_min: int
            , to: address
            , deadline: int
        ): (amount_token * amount_ae) =
        require_deadline(deadline)
        let (amount_token, amount_ae) = remove_liquidity(
                  token, state.wae_aex9
                , liquidity
                , amount_token_min, amount_ae_min
                , Contract.address
                , deadline
                )
        token.transfer(to, amount_token)
        state.wae.withdraw(amount_ae)
        Chain.spend(to, amount_ae)
        (amount_token, amount_ae)

    //------------------------------------------------------------------------------
    // SWAPS
    //------------------------------------------------------------------------------

    // requires the initial amount to have already been sent to the first pair
    stateful function swap'(
            amounts: list(int)
            , path: list(IAEX9Minimal)
            , to: address
            , factory: IAedexV2Factory                  // we pass it as parameter to save multiple state lookups
            , callback_opt: option(IAedexV2Callback)
        ): unit =
        switch((path, amounts))
            (input::output::_path, _::amount_out::_amounts) =>
                let (token0, _) = AedexV2Library.sort_tokens(input, output)
                let (amount0_out, amount1_out) = if (input == token0) (0, amount_out) else (amount_out, 0)
                let to' = switch(_path)
                            [] => to
                            (nexOutput::_) => AedexV2Library.pair_for(factory, output, nexOutput).address
                let pair: IAedexV2Pair = AedexV2Library.pair_for(factory, input, output)

                pair.swap(amount0_out, amount1_out, to', callback_opt)
                swap'(amount_out::_amounts, output::_path, to, factory, callback_opt)
            (path, _) | List.length(path) =< 1 => ()
            _ => abort_invalid_amounts()

    stateful entrypoint swap_exact_tokens_for_tokens(
              amount_in: int                         // - the exact amount of token provided for swap
            , amount_out_min: int                    // - the lower boundary for received token
                                                     //   if  amount_out < amount_out_min  transaction will
                                                     //   be aborted
            , path: list(IAEX9Minimal)               // - the path of Pairs from token_in to the token_out
            , to: address                            // - address at which the tokens will be transfer
            , deadline: int
            , callback_opt: option(IAedexV2Callback) // see swap comments
        ): list(int) =
        require_deadline(deadline)
        let factory = state.factory
        let amounts = AedexV2Library.get_amounts_out(factory, amount_in, path)
        require( last(amounts) >= amount_out_min,
                 "AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT"
               )
        List.get(0, path).transfer_allowance(
            Call.caller,
            first_pair(factory, path).address,
            List.get(0, amounts)
            )
        swap'(amounts, path, to, factory, callback_opt)
        amounts

    // Swaps some calculated AEX9 tokens(in) for an exact/fixed AEX9 tokens(out)
    stateful entrypoint swap_tokens_for_exact_tokens(
              amount_out: int                        // - exact amount of tokens to be received
            , amount_in_max: int                     // - upper boundary for the input tokens.
                                                     //   if the  amount_in > amount_in_max  the transaction
                                                     //   will be aborted
            , path: list(IAEX9Minimal)               // - path of Pairs
            , to: address                            // - address at which the tokens will be transfer
            , deadline: int
            , callback_opt: option(IAedexV2Callback) // - see swap comments
        ): list(int) =
        require_deadline(deadline)
        let factory = state.factory
        let amounts = AedexV2Library.get_amounts_in(factory, amount_out, path)
        require(List.get(0, amounts) =< amount_in_max, "AedexV2Router: EXCESSIVE_INPUT_AMOUNT")
        List.get(0, path).transfer_allowance(
            Call.caller,
            first_pair(factory, path).address,
            List.get(0, amounts)
            )
        swap'(amounts, path, to, factory, callback_opt)
        amounts

    payable stateful entrypoint swap_exact_ae_for_tokens(
              amount_out_min: int                     // - lower boundary for token_out
            , path: list(IAEX9Minimal)                // - path of Pairs
                                                      //   first element of  path  should be  state.wae , otherwise
                                                      //   transaction will fail
            , to: address                             // - address at which the tokens will be transfer
            , deadline: int
            , callback_opt: option(IAedexV2Callback)  // - see swap comments
        ): list(int) =
        require_deadline(deadline)
        let (wae, factory) = (state.wae, state.factory)
        require(first(path).address == wae.address, "AedexV2Router: INVALID_PATH_FIRST")
        let amounts = AedexV2Library.get_amounts_out(factory, Call.value, path)
        require(last(amounts) >= amount_out_min, "AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT")
        wae.deposit_to(
            first_pair(factory, path).address,
            value=List.get(0, amounts) )
        swap'(amounts, path, to, factory, callback_opt )
        amounts

    stateful entrypoint swap_tokens_for_exact_ae(
              amount_out: int                        // - exact amount of expected AE
            , amount_in_max: int                     // - upper boundary for spended AEX9 token
            , path: list(IAEX9Minimal)               // - path of Pairs
            , to: address                            // - address at which the AE will be transfered
            , deadline: int
            , callback_opt: option(IAedexV2Callback) // - see swap comments
        ): list(int) =
        require_deadline(deadline)
        let (wae, factory) = (state.wae, state.factory)
        require(last(path).address == state.wae.address, "AedexV2Router: INVALID_PATH_LAST")
        let amounts = AedexV2Library.get_amounts_in(factory, amount_out, path)
        require(List.get(0, amounts) =< amount_in_max, "AedexV2Router: EXCESSIVE_INPUT_AMOUNT")
        first(path).transfer_allowance(
            Call.caller,
            first_pair(factory, path).address,
            first(amounts)
            )
        swap'(amounts, path, Contract.address, factory, callback_opt)
        let last_amount = last(amounts)
        wae.withdraw(last_amount)
        Chain.spend(to, last_amount)
        amounts

    stateful entrypoint swap_exact_tokens_for_ae(
          amount_in: int                            // - exact amount of tokens offered for exchange
        , amount_out_min: int                       // - lower boundary of AE to be received
        , path: list(IAEX9Minimal)                  // - path of pairs
        , to: address                               // - address at which the AE will be transfered
        , deadline: int
        , callback_opt: option(IAedexV2Callback)    // - see swap comments
        ): list(int) =
        require_deadline(deadline)
        let (wae, factory) = (state.wae, state.factory)
        require(last(path).address == wae.address, "AedexV2Router: INVALID_PATH_LAST")
        let amounts = AedexV2Library.get_amounts_out(factory, amount_in, path)
        require(last(amounts)>= amount_out_min, "AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT")
        first(path).transfer_allowance(
            Call.caller,
            first_pair(factory, path).address,
            first(amounts)
            )
        swap'(amounts, path, Contract.address, factory, callback_opt)
        let last_amount = last(amounts)
        wae.withdraw(last_amount)
        Chain.spend(to, last_amount)
        amounts

    payable stateful entrypoint swap_ae_for_exact_tokens(
              amount_out: int                         // - exact amount of tokes expected to be received
            , path: list(IAEX9Minimal)                // - path of pairs
            , to: address                             // - address at which tokens should be transfered
            , deadline: int
            , callback_opt: option(IAedexV2Callback)  // - see swap comments
        ): list(int) =
        require_deadline(deadline)
        let (wae, factory) = (state.wae, state.factory)
        require(first(path).address == wae.address, "AedexV2Router: INVALID_PATH_FIRST")
        let amounts = AedexV2Library.get_amounts_in(factory, amount_out, path)
        let first_amount = first(amounts)
        require(first(amounts) =< Call.value, "AedexV2Router: EXCESSIVE_INPUT_AMOUNT")
        wae.deposit_to(
            first_pair(factory, path).address,
            value=first_amount)
        swap'(amounts, path, to, factory, callback_opt)
        if (Call.value > first_amount)
            Chain.spend(Call.caller, Call.value - first_amount) // refund dust ae, if any
        amounts

    // **** LIB EXPOSURE ****
    entrypoint quote(amount_a, reserve_a, reserve_b ) =
        AedexV2Library.quote(amount_a, reserve_a, reserve_b)

    entrypoint get_amount_out( amount_in, reserve_in, reserve_out) =
        AedexV2Library.get_amount_out( amount_in, reserve_in, reserve_out)

    entrypoint get_amount_in( amount_out, reserve_in, reserve_out) =
        AedexV2Library.get_amount_in( amount_out, reserve_in, reserve_out)

    entrypoint get_amounts_out( amount_in , path) =
        AedexV2Library.get_amounts_out(state.factory, amount_in , path)

    entrypoint get_amounts_in( amount_out , path) =
        AedexV2Library.get_amounts_in(state.factory, amount_out , path)

    // **** UTILS ****
    function first_pair( factory: IAedexV2Factory, path: list(IAEX9Minimal)): IAedexV2Pair =
        AedexV2Library.pair_for(factory, List.get(0, path), List.get(1, path))

    function last(xs: list('a)): 'a = List.get(List.length(xs)-1, xs)

    function first(xs: list('a)): 'a = List.get(0, xs)

    function require_deadline(deadline: int) =
        require(deadline >= Chain.timestamp, "AedexV2Router: EXPIRED")

    function abort_invalid_amounts() =
        abort("AedexV2Router: AMOUNT_LIST_IS_SHORTER")


`;
