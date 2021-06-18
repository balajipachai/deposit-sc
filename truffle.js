const HDWalletProvider = require("@truffle/hdwallet-provider");
const MNEMONIC = 'WALLET MNEMONIC';

module.exports = {

    plugins: ["solidity-coverage"],

    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    description: "Test Configuration",
    authors: [
        "Balaji Shetty Pachai <balaji.pachai08@gmail.com>"
    ],
    networks: {
        development: {
            name: "development",
            protocol: "http",
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            gas: 6721975,
            gasPrice: 1,
        },
        mainnet: {
            name: "mainnet",
            provider: function () {
                return new HDWalletProvider(MNEMONIC, "INFURA MAINNET ENDPOINT", 0, 10)
            },
            network_id: 1,
            gas: 8000000
        },
        ropsten: {
            name: "ropsten",
            provider: function () {
                return new HDWalletProvider(MNEMONIC, "INFURA ROPSTEN ENDPOINT", 0, 10)
            },
            network_id: 3,
            gas: 8000000
        },
        rinkeby: {
            name: "rinkeby",
            provider: function () {
                return new HDWalletProvider(MNEMONIC, "INFURA RINKEBY ENDPOINT", 0, 10)
            },
            network_id: 4,
            gas: 8000000,
        },
        goerli: {
            name: "goerli",
            provider: function () {
                return new HDWalletProvider(MNEMONIC, "INFURA GOERLI ENDPOINT", 0, 10)
            },
            network_id: 5,
            gas: 8000000
        },
        kovan: {
            name: "kovan",
            provider: function () {
                return new HDWalletProvider(MNEMONIC, "INFURA KOVAN ENDPOINT", 0, 10)
            },
            network_id: 42,
            gas: 8000000
        },
    },
    mocha: {
        useColors: true
    },
    compilers: {
        solc: {
            version: "0.8.4",
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    test_directory: "test",
    migrations_directory: "migrations",

};
