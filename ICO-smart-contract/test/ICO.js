const {
  loadFixture
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("ICO", function () {
  async function deployICOFixture() {
  
  
    const [owner, otherAccount] = await ethers.getSigners();
    const ICOToken = await ethers.getContractFactory("ICOToken");
    const ICO = await ethers.getContractFactory("ICO");

    const token = await ICOToken.deploy("Wrapped ETH","WETH",ethers.utils.parseEther("1000000","wei"))
    console.log("token.address",token.address)
    console.log(
      Math.floor(Date.now() / 1000) + 60, // start time 1 minute from now
      Math.floor(Date.now() / 1000) + 600, // end time 10 minutes from now
      ethers.utils.parseEther('0.5', 'wei'),
      ethers.utils.parseEther('1', 'wei'),
      token.address,
      ethers.utils.parseEther("0.001","wei") // rate
    )
    const ico = await ICO.deploy(
      Math.floor(Date.now() / 1000) + 60, // start time 1 minute from now
      Math.floor(Date.now() / 1000) + 600, // end time 10 minutes from now
      ethers.utils.parseEther('0.5', 'wei'),
      ethers.utils.parseEther('1', 'wei'),
      token.address,
      ethers.utils.parseEther("0.001","wei") // rate
    );
      console.log("ico",ico.address)


      await token.connect(owner).mint(ico.address,ethers.utils.parseEther('1000000', 'wei'))

    return { token, ico, owner, otherAccount };
  }

  describe("Deployment", function () {
   
    it('should initialize ICO contract correctly', async () => {
      let {ico } =  await loadFixture(deployICOFixture)
      expect(await ico.startTime()).to.be.above(0);
      expect(await ico.closeTime()).to.be.above(await ico.startTime());
      expect(await ico.softCap()).to.equal(ethers.utils.parseEther('0.5', 'wei'));
      expect(await ico.hardCap()).to.equal(ethers.utils.parseEther('1', 'wei'));
      expect(await ico.rate()).to.equal(ethers.utils.parseEther('0.001', 'wei'));
    });
  
    it('should not allow investment before start time', async () => {
      let {ico, otherAccount} = await loadFixture(deployICOFixture)

      await expect(
        ico.connect(otherAccount).invest({ value: ethers.utils.parseEther('0.01', 'wei') })
      ).to.be.revertedWithCustomError(ico,'CanNotInvestBeforeStart');
    });
  
   
  

  
  
    it('should allow valid investment', async () => {
      let {token, ico, owner, otherAccount} = await loadFixture(deployICOFixture)

      await network.provider.send('evm_increaseTime', [61]); // move time forward by 60 seconds
      await network.provider.send('evm_mine'); // mine a new block to finalize the time change
      await expect(ico.connect(otherAccount).invest({ value: ethers.utils.parseEther('0', 'wei') })).to.be.revertedWithCustomError(ico,'ZeroAmount');

      await expect(ico.connect(otherAccount).invest({ value: ethers.utils.parseEther('0.1', 'wei') })).to.emit(ico, 'Invest').withArgs(otherAccount.address, ethers.utils.parseEther('0.1', 'wei'),ethers.utils.parseEther('100', 'wei'));
      await expect(ico.connect(otherAccount).invest({ value: ethers.utils.parseEther('0.4', 'wei') })).to.emit(ico, 'Invest').withArgs(otherAccount.address, ethers.utils.parseEther('0.4', 'wei'),ethers.utils.parseEther('400', 'wei'));
      await network.provider.send('evm_increaseTime', [700]); // move time forward by 700 seconds
      await network.provider.send('evm_mine'); // mine a new block to finalize the time change
  
      await expect(ico.connect(owner).withdraw()).to.emit(ico, 'Withdrawal').withArgs(owner.address, ethers.utils.parseEther('0.5', 'wei'));

      expect(await token.balanceOf(otherAccount.address),ethers.utils.parseEther('2000', 'wei'))

    });

    it('should not allow investment after close time', async () => {
      let {ico, otherAccount} = await loadFixture(deployICOFixture)

      await network.provider.send('evm_increaseTime', [700]); // move time forward by 700 seconds
      await network.provider.send('evm_mine'); // mine a new block to finalize the time change
  
      await expect(ico.connect(otherAccount).invest({ value: ethers.utils.parseEther('0.01', 'wei') })).to.be.revertedWithCustomError(ico,'CanNotInvestAfterClosing');
    });
  
    it('should not allow withdrawal before close time', async () => {
      let {ico, owner} = await loadFixture(deployICOFixture)

      await expect(ico.connect(owner).withdraw()).to.be.revertedWithCustomError(ico,'NotOpen');
    });
  
 
  
    it('should not allow changing price to zero or less than rate', async () => {
      let {ico, owner} = await loadFixture(deployICOFixture)

      await expect(ico.connect(owner).changePrice(0)).to.be.revertedWithCustomError(ico,'ZeroAmount');
      // await expect(ico.connect(owner).changePrice(50)).to.be.revertedWithCustomError(ico,'ZeroAmount');
    });
  
    it('should allow owner to change the price', async () => {
      let {ico, owner} = await loadFixture(deployICOFixture)

      await ico.connect(owner).changePrice(ethers.utils.parseEther('0.0001', 'wei'))
      expect(await ico.rate()).to.equal(ethers.utils.parseEther('0.0001', 'wei'));
    });
  
  });

});
