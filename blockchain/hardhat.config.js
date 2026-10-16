import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
    plugins: [hardhatEthers],

    solidity: "0.8.20",

    networks: {
        localhost: {
            type: "http",
            url: "http://127.0.0.1:8545"
        }
    }
});