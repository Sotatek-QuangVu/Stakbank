const {BigNumber} = require("ethers");

let stake1 = [BigNumber.from("301510"), BigNumber.from("300000")];
let timestake1 = [BigNumber.from("1614227414"), BigNumber.from("1614050373")];

let stake2 = [BigNumber.from("82541"), BigNumber.from("15000")];
let timestake2 = [BigNumber.from("1614227478"), BigNumber.from("1614050378")];

let timedis = [BigNumber.from("1614227820")];
let eth = [BigNumber.from("3000000000000000000")];


let totalTime = (stake1[0].mul(6))
                .add(stake2[0].mul(5));

let A = BigNumber.from("2999999999999559105");
let unitValue = A.div(totalTime);

console.log(unitValue.toString());