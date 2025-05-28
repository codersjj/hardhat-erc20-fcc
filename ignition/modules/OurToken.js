const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { INITIAL_SUPPLY } = require("../../helper-hardhat-config");

module.exports = buildModule("OurTokenModule", (m) => {
  const ourToken = m.contract("OurToken", [INITIAL_SUPPLY]);

  return { ourToken };
});
