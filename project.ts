import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

// Can expand the Datasource processor types via the generic param
const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "synthmos-subql",
  description: "Subql for the Synthmos Protocol",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /**
     *  chainId is the EVM Chain ID, for Avalanche Fuji this is 43113
     *  https://chainlist.org/chain/43113
     */
    chainId: "43113",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: ["https://rpc.ankr.com/avalanche_fuji"],
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      // This is usually the block that the contract was deployed on https://testnet.snowtrace.io/token/0x1d308089a2d1ced3f1ce36b1fcaf815b07217be3
      startBlock: 28355658,
      options: {
        // Must be a key of assets
        abi: "controller",
        // This is the contract address for Wrapped Ether https://testnet.snowtrace.io/token/0x1d308089a2d1ced3f1ce36b1fcaf815b07217be3
        address: "0xa52f409bCA3a652603AA9345D8Ef20525D8EDf54",
      },
      assets: new Map([["controller", { file: "./abis/controller.abi.json" }]]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleClaimableRound",
            filter: {
              topics: [
                "ClaimableRound(indexed bytes32,indexed uint256,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleCreateMarket",
            filter: {
              topics: [
                "CreateMarket(indexed bytes32,indexed bytes32,indexed address,address,uint8,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleDeposit",
            filter: {
              topics: [
                "Deposit(indexed bytes32,indexed address,indexed bytes32,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleHigh",
            filter: {
              topics: [
                "High(indexed bytes32,indexed uint256,indexed bytes32,bytes32,int256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleLow",
            filter: {
              topics: [
                "Low(indexed bytes32,indexed uint256,indexed bytes32,bytes32,int256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleNewRound",
            filter: {
              topics: [
                "NewRound(indexed bytes32,indexed uint256,uint256,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePositionError",
            filter: {
              topics: ["PositionError(indexed bytes32,uint8)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleSetProtocolFee",
            filter: {
              topics: ["SetProtocolFee(indexed bytes32,uint8,uint8)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleSettlePosition",
            filter: {
              topics: [
                "SettlePosition(indexed bytes32,indexed bytes32,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleSettleRound",
            filter: {
              topics: [
                "SettleRound(indexed bytes32,indexed uint256,uint256,int256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleWithdrawal",
            filter: {
              topics: [
                "Withdrawal(indexed bytes32,indexed address,indexed bytes32,uint256)",
              ],
            },
          },
        ],
      },
    },
  ],
  repository: "https://github.com/cassavalabs/synthmos-subql",
};

// Must set default to the project instance
export default project;
