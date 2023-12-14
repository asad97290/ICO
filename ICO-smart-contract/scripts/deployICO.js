const hre = require("hardhat");
const ICO = require("../args/ICO");
async function main() {
  const [owner] = await ethers.getSigners();
  const ICOToken = await ethers.getContractFactory("ICOToken");
  const token = ICOToken.attach(
    ICO[4]
  );
  const ICO = await ethers.getContractFactory("ICO")
  
  const ico = await ICO.deploy(
    ICO[0], 
    ICO[1], 
    ICO[2],
    ICO[3],
    ICO[4], // token
    ICO[5],
  );
  await ico.deployed();
  
  await token.connect(owner).mint(ico.address,ethers.utils.parseUnits('1000000', 'wei'))
console.log("ICO",ico.address)
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
