const { Web3 } = require('hardhat')
const BigNumber = require('bignumber.js')

function delay(time) {
    let now = Date.now()
    while(1) {
        let current = Date.now()
        if (current - now >= time) {
            break
        }
    }
}

async function main() {

    const web3 = new Web3("https://goerli.infura.io/v3/fa2eb114f1084dd694d5f8817dc6bc26");

    const abi = [
        {
            "inputs": [
              {
                "internalType": "uint256",
                "name": "stakedAmount",
                "type": "uint256"
              }
            ],
            "name": "stake",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ]

    const contractAddress = "0x3a1ab0aA20Ca3AAC481852bB519624C0Fb17553D"
    const contract = new web3.eth.Contract(abi, contractAddress)

    const txData = contract.methods.stake("1000000000000000000").encodeABI()
    
    let trans = []

    let n = await web3.eth.getTransactionCount('0xD3976919BA13b648F6cA636922fa55B94767b2eC')

    for (let i = 0; i < 450; i++) {

        const tx = {
            to: contractAddress,
            value: "5000000000000000",
            gasPrice: "2000000000",
            gas: "500000",
            data: txData,
            nonce: n
        }
        let signed = await web3.eth.accounts.signTransaction(tx, '5147a85c309993daa363d2066fccbb2c66a3f8043f80c579958e9512c25ea5d0')
        trans.push( web3.eth.sendSignedTransaction(signed.rawTransaction) )

        n ++
    }

    Promise.all(trans)

}

main()
.then(() => process.exit(0))
.catch((err) => {
    console.log(err);
    process.exit(1);
})