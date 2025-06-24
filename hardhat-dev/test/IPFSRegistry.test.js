const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IPFSRegistry Contract", function () {
  let IPFSRegistry;
  let ipfsRegistry;
  let owner, writer, reader, other;

  // Ejemplo de datos reales
  const exampleIpfsHash = "QmXnnyufdzAWL5CqZ2RnSNgPbvCc1ALT73s6epPrRnZ1Xy";
  const exampleSha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // hash SHA256 vacío
  const exampleCollection = "users";
  const exampleType = "user_data";

  beforeEach(async function () {
    [owner, writer, reader, other] = await ethers.getSigners();
    const IPFSRegistryFactory = await ethers.getContractFactory("IPFSRegistry");
    ipfsRegistry = await IPFSRegistryFactory.deploy();
    await ipfsRegistry.waitForDeployment();
    // Otorgar roles
    await ipfsRegistry.connect(owner).grantRole(await ipfsRegistry.WRITER_ROLE(), writer.address);
    await ipfsRegistry.connect(owner).grantRole(await ipfsRegistry.READER_ROLE(), reader.address);
  });

  it("Debería almacenar un registro IPFS correctamente", async function () {
    await expect(
      ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType)
    ).to.emit(ipfsRegistry, "RecordStored");
    const total = await ipfsRegistry.getTotalRecords();
    expect(total).to.equal(1);
    const record = await ipfsRegistry.getRecord(1);
    expect(record.ipfsHash).to.equal(exampleIpfsHash);
    expect(record.sha256Hash).to.equal(exampleSha256);
    expect(record.collection).to.equal(exampleCollection);
    expect(record.dataType).to.equal(exampleType);
    expect(record.active).to.be.true;
  });

  it("No debe permitir almacenar con hash vacío", async function () {
    await expect(
      ipfsRegistry.connect(writer).storeRecord("", exampleSha256, exampleCollection, exampleType)
    ).to.be.revertedWith("IPFS hash cannot be empty");
  });

  it("Debería actualizar un registro existente", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    const newIpfsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const newSha256 = "abc123";
    await expect(
      ipfsRegistry.connect(writer).updateRecord(1, newIpfsHash, newSha256)
    ).to.emit(ipfsRegistry, "RecordUpdated");
    const record = await ipfsRegistry.getRecord(1);
    expect(record.ipfsHash).to.equal(newIpfsHash);
    expect(record.sha256Hash).to.equal(newSha256);
  });

  it("Debería desactivar un registro", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    await expect(
      ipfsRegistry.connect(writer).deactivateRecord(1)
    ).to.emit(ipfsRegistry, "RecordDeactivated");
    const record = await ipfsRegistry.records(1);
    expect(record.active).to.be.false;
  });

  it("Debería consultar por hash y por colección", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    const recordByHash = await ipfsRegistry.getRecordByHash(exampleIpfsHash);
    expect(recordByHash.ipfsHash).to.equal(exampleIpfsHash);
    const ids = await ipfsRegistry.getRecordsByCollection(exampleCollection);
    expect(ids.length).to.equal(1);
    expect(ids[0]).to.equal(1);
  });

  it("Debería consultar por usuario", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    const ids = await ipfsRegistry.getRecordsByUser(writer.address);
    expect(ids.length).to.equal(1);
    expect(ids[0]).to.equal(1);
  });

  it("Debería verificar existencia de hash", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    const exists = await ipfsRegistry.hashExists(exampleIpfsHash);
    expect(exists).to.be.true;
    const notExists = await ipfsRegistry.hashExists("QmNoExiste");
    expect(notExists).to.be.false;
  });

  it("Solo el owner o admin puede actualizar o desactivar registros", async function () {
    await ipfsRegistry.connect(writer).storeRecord(exampleIpfsHash, exampleSha256, exampleCollection, exampleType);
    await expect(
      ipfsRegistry.connect(other).updateRecord(1, "QmOtro", "sha256")
    ).to.be.revertedWith("Only owner or admin can update record");
    await expect(
      ipfsRegistry.connect(other).deactivateRecord(1)
    ).to.be.revertedWith("Only owner or admin can deactivate record");
  });
}); 