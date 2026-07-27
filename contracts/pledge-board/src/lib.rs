#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

const INSTANCE_BUMP_LEDGERS: u32 = 30 * 17_280;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_LEDGERS - 17_280;
const PLEDGE_BUMP_LEDGERS: u32 = 90 * 17_280;
const PLEDGE_LIFETIME_THRESHOLD: u32 = PLEDGE_BUMP_LEDGERS - 17_280;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum PledgeStatus {
    Open,
    Funded,
    Paid,
    Refunded,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Pledge {
    pub donor: Address,
    pub charity: Address,
    pub asset: Address,
    pub amount: i128,
    pub due_ledger: u32,
    pub status: PledgeStatus,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Asset,
    Pledge(u64),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidParty = 3,
    InvalidAmount = 4,
    InvalidDueLedger = 5,
    PledgeExists = 6,
    PledgeNotFound = 7,
    InvalidStatus = 8,
    DueDateNotReached = 9,
}

#[contract]
pub struct PledgeBoardContract;

#[contractevent(data_format = "single-value")]
pub struct Initialized {
    pub admin: Address,
}

#[contractevent(data_format = "single-value")]
pub struct PledgeCreated {
    pub pledge_id: u64,
}

#[contractevent(data_format = "single-value")]
pub struct PledgeFunded {
    pub pledge_id: u64,
}

#[contractevent(data_format = "single-value")]
pub struct PledgePaid {
    pub pledge_id: u64,
}

#[contractevent(data_format = "single-value")]
pub struct PledgeRefunded {
    pub pledge_id: u64,
}

#[contractevent(data_format = "single-value")]
pub struct PledgeCancelled {
    pub pledge_id: u64,
}

#[contractimpl]
impl PledgeBoardContract {
    pub fn initialize(e: Env, admin: Address, asset: Address) -> Result<(), Error> {
        if e.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::Asset, &asset);
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_LEDGERS);
        Initialized { admin }.publish(&e);
        Ok(())
    }

    pub fn admin(e: Env) -> Result<Address, Error> {
        e.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }
    pub fn asset(e: Env) -> Result<Address, Error> {
        e.storage()
            .instance()
            .get(&DataKey::Asset)
            .ok_or(Error::NotInitialized)
    }

    pub fn create_pledge(
        e: Env,
        pledge_id: u64,
        donor: Address,
        charity: Address,
        amount: i128,
        due_ledger: u32,
    ) -> Result<(), Error> {
        let asset: Address = e
            .storage()
            .instance()
            .get(&DataKey::Asset)
            .ok_or(Error::NotInitialized)?;
        if donor == charity {
            return Err(Error::InvalidParty);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if due_ledger <= e.ledger().sequence() {
            return Err(Error::InvalidDueLedger);
        }
        let key = DataKey::Pledge(pledge_id);
        if e.storage().persistent().has(&key) {
            return Err(Error::PledgeExists);
        }
        donor.require_auth();
        let pledge = Pledge {
            donor,
            charity,
            asset,
            amount,
            due_ledger,
            status: PledgeStatus::Open,
        };
        e.storage().persistent().set(&key, &pledge);
        e.storage()
            .persistent()
            .extend_ttl(&key, PLEDGE_LIFETIME_THRESHOLD, PLEDGE_BUMP_LEDGERS);
        PledgeCreated { pledge_id }.publish(&e);
        Ok(())
    }

    pub fn get_pledge(e: Env, pledge_id: u64) -> Result<Pledge, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Pledge(pledge_id))
            .ok_or(Error::PledgeNotFound)
    }

    pub fn fund(e: Env, pledge_id: u64) -> Result<(), Error> {
        let key = DataKey::Pledge(pledge_id);
        let mut pledge = Self::read_pledge(&e, pledge_id)?;
        if pledge.status != PledgeStatus::Open {
            return Err(Error::InvalidStatus);
        }
        pledge.donor.require_auth();
        token::Client::new(&e, &pledge.asset).transfer(
            &pledge.donor,
            &e.current_contract_address(),
            &pledge.amount,
        );
        pledge.status = PledgeStatus::Funded;
        Self::write_pledge(&e, &key, &pledge);
        PledgeFunded { pledge_id }.publish(&e);
        Ok(())
    }

    pub fn release(e: Env, pledge_id: u64) -> Result<(), Error> {
        let key = DataKey::Pledge(pledge_id);
        let mut pledge = Self::read_pledge(&e, pledge_id)?;
        if pledge.status != PledgeStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        pledge.charity.require_auth();
        token::Client::new(&e, &pledge.asset).transfer(
            &e.current_contract_address(),
            &pledge.charity,
            &pledge.amount,
        );
        pledge.status = PledgeStatus::Paid;
        Self::write_pledge(&e, &key, &pledge);
        PledgePaid { pledge_id }.publish(&e);
        Ok(())
    }

    pub fn refund(e: Env, pledge_id: u64) -> Result<(), Error> {
        let key = DataKey::Pledge(pledge_id);
        let mut pledge = Self::read_pledge(&e, pledge_id)?;
        if pledge.status != PledgeStatus::Funded {
            return Err(Error::InvalidStatus);
        }
        if e.ledger().sequence() < pledge.due_ledger {
            return Err(Error::DueDateNotReached);
        }
        pledge.donor.require_auth();
        token::Client::new(&e, &pledge.asset).transfer(
            &e.current_contract_address(),
            &pledge.donor,
            &pledge.amount,
        );
        pledge.status = PledgeStatus::Refunded;
        Self::write_pledge(&e, &key, &pledge);
        PledgeRefunded { pledge_id }.publish(&e);
        Ok(())
    }

    pub fn cancel(e: Env, pledge_id: u64) -> Result<(), Error> {
        let key = DataKey::Pledge(pledge_id);
        let mut pledge = Self::read_pledge(&e, pledge_id)?;
        if pledge.status != PledgeStatus::Open {
            return Err(Error::InvalidStatus);
        }
        pledge.donor.require_auth();
        pledge.status = PledgeStatus::Cancelled;
        Self::write_pledge(&e, &key, &pledge);
        PledgeCancelled { pledge_id }.publish(&e);
        Ok(())
    }
}

impl PledgeBoardContract {
    fn read_pledge(e: &Env, id: u64) -> Result<Pledge, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Pledge(id))
            .ok_or(Error::PledgeNotFound)
    }
    fn write_pledge(e: &Env, key: &DataKey, pledge: &Pledge) {
        e.storage().persistent().set(key, pledge);
        e.storage()
            .persistent()
            .extend_ttl(key, PLEDGE_LIFETIME_THRESHOLD, PLEDGE_BUMP_LEDGERS);
    }
}

#[cfg(test)]
mod test {
    extern crate std;
    use super::{Error, PledgeBoardContract, PledgeBoardContractClient, PledgeStatus};
    use soroban_sdk::{testutils::Address as _, token, Address, Env};

    fn setup<'a>(
        e: &'a Env,
    ) -> (
        PledgeBoardContractClient<'a>,
        Address,
        Address,
        Address,
        Address,
    ) {
        let admin = Address::generate(e);
        let donor = Address::generate(e);
        let charity = Address::generate(e);
        let asset = e
            .register_stellar_asset_contract_v2(Address::generate(e))
            .address();
        let id = e.register(PledgeBoardContract, ());
        let client = PledgeBoardContractClient::new(e, &id);
        e.mock_all_auths();
        client.initialize(&admin, &asset);
        (client, admin, donor, charity, asset)
    }

    #[test]
    fn fund_and_pay_round_trip() {
        let e = Env::default();
        let (client, _admin, donor, charity, asset) = setup(&e);
        client.create_pledge(
            &1,
            &donor,
            &charity,
            &100_i128,
            &(e.ledger().sequence() + 100),
        );
        let token_client = token::StellarAssetClient::new(&e, &asset);
        token_client.mint(&donor, &100_i128);
        client.fund(&1);
        client.release(&1);
        assert_eq!(client.get_pledge(&1).status, PledgeStatus::Paid);
        assert_eq!(token_client.balance(&charity), 100);
    }

    #[test]
    fn refund_is_blocked_before_due_ledger() {
        let e = Env::default();
        let (client, _admin, donor, charity, asset) = setup(&e);
        client.create_pledge(
            &2,
            &donor,
            &charity,
            &100_i128,
            &(e.ledger().sequence() + 100),
        );
        let token_client = token::StellarAssetClient::new(&e, &asset);
        token_client.mint(&donor, &100_i128);
        client.fund(&2);
        assert_eq!(
            client.try_refund(&2).unwrap_err().unwrap(),
            Error::DueDateNotReached
        );
    }

    #[test]
    fn cancel_open_pledge() {
        let e = Env::default();
        let (client, _admin, donor, charity, _asset) = setup(&e);
        client.create_pledge(
            &3,
            &donor,
            &charity,
            &100_i128,
            &(e.ledger().sequence() + 100),
        );
        client.cancel(&3);
        assert_eq!(client.get_pledge(&3).status, PledgeStatus::Cancelled);
    }
}
