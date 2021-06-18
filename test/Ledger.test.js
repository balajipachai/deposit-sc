const { expectRevert, balance, constants, expectEvent, send, ether, time } = require('@openzeppelin/test-helpers')
const { assert } = require('chai');
const BigNumber = require('bignumber.js')
const Ledger = artifacts.require("Ledger")
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
const { USDTABI, USDTADDRESS } = require("../utils/constants")

contract('Ledger is [Ownable]', (accounts) => {
    const [owner, depositor1, depositor2, transferAcc, recipient] = accounts
    const USDT_OWNER = "0xc6cde7c39eb2f0f0095f41570af89efc2c1ea828";
    const USDT_TRANSFER_AMOUNT = '1000000000'; //1000 USDT, since USDT has 6 Decimals

    let ledgerConInstance;
    let usdtConInstance;
    let txObject;

    describe('Ledger tests', () => {
        before(async () => {
            await send.ether(transferAcc, USDT_OWNER, ether('80'))
            usdtConInstance = new web3.eth.Contract(USDTABI, USDTADDRESS);
            ledgerConInstance = await Ledger.new({ from: owner })
            // Transfer 1000 USDT to depositor1 & depositor2
            await usdtConInstance.methods.transfer(depositor1, USDT_TRANSFER_AMOUNT).send({ from: USDT_OWNER })
            await usdtConInstance.methods.transfer(depositor2, USDT_TRANSFER_AMOUNT).send({ from: USDT_OWNER })
        })
        describe('Basic checks', () => {
            let result;
            context('Ledger', () => {
                it('should have USDT address set to `0xdAC17F958D2ee523a2206206994597C13D831ec7`', async () => {
                    result = await ledgerConInstance.USDT.call()
                    assert.equal(result, '0xdAC17F958D2ee523a2206206994597C13D831ec7', "USDT addresses do not match")
                })
                it('should have isWithdrawalAllowed to be `false`', async () => {
                    result = await ledgerConInstance.isWithdrawalAllowed.call()
                    assert.equal(result, false, "isWithdrawalAllowed do not match")
                })
            })
            context('USDT', () => {
                let name, symbol, tokenDecimals, usdtOwner;
                it('should have token name to be `Tether USD`', async () => {
                    name = await usdtConInstance.methods.name().call()
                    assert.equal(name, 'Tether USD', "Token name do not match")
                })
                it('should have token symbol to be `USDT`', async () => {
                    symbol = await usdtConInstance.methods.symbol().call()
                    assert.equal(symbol, 'USDT', "Token symbol do not match")
                })
                it('should have token tokenDecimals to be 6', async () => {
                    tokenDecimals = await usdtConInstance.methods.decimals().call()
                    assert.equal(tokenDecimals, 6, "Token decimals do not match")
                })
                it('should verify owner is 0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828', async () => {
                    usdtOwner = await usdtConInstance.methods.getOwner().call();
                    assert.equal(usdtOwner, "0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828", "Total supply do not match")
                })
            })

        })

        describe('receive', () => {
            it('contract should receive Ether', async () => {
                txObject = await ledgerConInstance.send(new BigNumber(1e18), { from: owner })
                assert.equal(txObject.receipt.status, true, "Ether send failed")
            })
            it('should verify contract balance to be 1 ETH', async () => {
                const bal = await balance.current(ledgerConInstance.address, 'ether')
                assert.equal(bal.toNumber(), 1, "Balances do not match")
            })
        })

        describe('deposit', () => {
            context('reverts', () => {
                it('when amount is 0', async () => {
                    await expectRevert(
                        ledgerConInstance.deposit(0, { from: depositor1 }),
                        "Deposit: Amount must be > 0"
                    );
                })
            })
            context('success', () => {
                const DEPOSIT_AMOUNT = '500000000'; //500 USDT
                let deposits;
                before(async () => {
                    // Give allowance to Ledger contract
                    await usdtConInstance.methods.approve(ledgerConInstance.address, constants.MAX_UINT256).send({ from: depositor1 })
                    await usdtConInstance.methods.approve(ledgerConInstance.address, constants.MAX_UINT256).send({ from: depositor2 })
                })
                it('should deposit 500 USDT from depositor1', async () => {
                    txObject = await ledgerConInstance.deposit(DEPOSIT_AMOUNT, { from: depositor1 })
                    assert.equal(txObject.receipt.status, true, "Deposit failed");
                })
                it("should check for Deposit event", async () => {
                    await expectEvent(
                        txObject.receipt,
                        'LogDeposit',
                        {
                            depositor: depositor1,
                            amount: DEPOSIT_AMOUNT
                        }
                    )
                })
                it('should deposit 500 USDT from depositor2', async () => {
                    txObject = await ledgerConInstance.deposit(DEPOSIT_AMOUNT, { from: depositor2 })
                    assert.equal(txObject.receipt.status, true, "Deposit failed");
                })
                it("should check for Deposit event", async () => {
                    await expectEvent(
                        txObject,
                        'LogDeposit',
                        {
                            depositor: depositor2,
                            amount: DEPOSIT_AMOUNT
                        }
                    )
                })
                it('should check deposits of depositor1 to be 500 USDT', async () => {
                    deposits = await ledgerConInstance.userDeposits.call(depositor1);
                    assert.equal(deposits.toNumber(), DEPOSIT_AMOUNT, "Deposits do not match")
                })
                it('should check deposits of depositor2 to be 500 USDT', async () => {
                    deposits = await ledgerConInstance.userDeposits.call(depositor2);
                    assert.equal(deposits.toNumber(), DEPOSIT_AMOUNT, "Deposits do not match")
                })
                it('should verify contract USDT balance to be 1000', async () => {
                    assert.equal((await usdtConInstance.methods.balanceOf(ledgerConInstance.address).call()), '1000000000', "Balances do not match")
                })
            })
        })

        describe('transfer', () => {
            const TRANSFER_AMOUNT = 100e6;
            context('reverts', () => {
                it('when caller is not the owner', async () => {
                    await expectRevert(
                        ledgerConInstance.transfer(recipient, TRANSFER_AMOUNT, { from: depositor1 }),
                        "Ownable: caller is not the owner"
                    );
                })
                it('when amount is 0', async () => {
                    await expectRevert(
                        ledgerConInstance.transfer(recipient, 0, { from: owner }),
                        "Transfer: Amount must be > 0"
                    );
                })
                it('when amount is > contract USDT balance', async () => {
                    await expectRevert(
                        ledgerConInstance.transfer(recipient, 2000e6, { from: owner }),
                        "Transfer: Insufficient balance"
                    );
                });
            });
            context('success', () => {
                it('should transfer 100 USDT to recipient from the contract', async () => {
                    txObject = await ledgerConInstance.transfer(recipient, TRANSFER_AMOUNT, { from: owner });
                    assert.equal(txObject.receipt.status, true, "Transfer failed");
                })
                it('should check recipient balance is 100 USDT', async () => {
                    assert.equal((await usdtConInstance.methods.balanceOf(recipient).call()), TRANSFER_AMOUNT, "Balance do not match")
                });
                it('should check contract balance is 900 USDT', async () => {
                    assert.equal((await usdtConInstance.methods.balanceOf(ledgerConInstance.address).call()), 900e6, "Balance do not match")
                });
            });
        })

        describe('withdraw', () => {
            it('reverts when withdrawal is not allowed', async () => {
                await expectRevert(
                    ledgerConInstance.withdraw({ from: depositor1 }),
                    "Cannot withdraw"
                );
            });
            it('reverts when there is no deposits', async () => {
                await ledgerConInstance.toggleWithdrawalStatus({ from: owner });
                await expectRevert(
                    ledgerConInstance.withdraw({ from: recipient }),
                    "Withdraw: No deposits"
                );
            });
            it('should check isWithdrawalAllowed to be true', async () => {
                assert.equal((await ledgerConInstance.isWithdrawalAllowed.call()), true, "isWithdrawalAllowed is false");
            })
            it('should withdraw deposits of depositor1 from the contract', async () => {
                txObject = await ledgerConInstance.withdraw({ from: depositor1 });
                assert.equal(txObject.receipt.status, true, "Withdraw failed");
            });
            it("should check for LogWithdraw event", async () => {
                await expectEvent(
                    txObject,
                    'LogWithdraw',
                    {
                        withdrawee: depositor1,
                        amount: '500000000'
                    }
                )
            })
            it('should check contract balance is 400 USDT', async () => {
                assert.equal((await usdtConInstance.methods.balanceOf(ledgerConInstance.address).call()), 400e6, "Balance do not match")
            });
            it('should check depositor1 balance is 1000 USDT', async () => {
                assert.equal((await usdtConInstance.methods.balanceOf(depositor1).call()), 1000e6, "Balance do not match")
            });
        });
    })
})