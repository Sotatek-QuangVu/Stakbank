const {BigNumber} = require("ethers");

let stake1 = [BigNumber.from("10000"), BigNumber.from("300000")];
let timestake1 = [BigNumber.from("1614050322"), BigNumber.from("1614050373")];

let stake2 = [BigNumber.from("60000"), BigNumber.from("15000")];
let timestake2 = [BigNumber.from("1614050342"), BigNumber.from("1614050378")];

let stake3 = [BigNumber.from("70000")];
let timestake3 = [BigNumber.from("1614050383")];

let distime = [BigNumber.from("1614050372"), BigNumber.from("1614050432"), BigNumber.from("1614050492")];

let eth = [BigNumber.from("60000000000000000000"), BigNumber.from("100000000000000300000"), BigNumber.from("80000000000007820000")];

let unitValue = [0, 0, 0, 0, 0, 0, 0];
let totalTime = [0, 0, 0, 0, 0, 0, 0];

totalTime[1] = (stake1[0].mul(distime[0].sub(timestake1[0])))
                .add(stake2[0].mul(distime[0].sub(timestake2[0])));
unitValue[1] = eth[0].div(totalTime[1]);

totalTime[2] = (stake1[1].mul(distime[1].sub(timestake1[1])))
                .add(stake2[1].mul(distime[1].sub(timestake2[1])))
                .add(stake3[0].mul(distime[1].sub(timestake3[0])))
                .add((stake1[0].add(stake2[0])).mul(60));

unitValue[2] = eth[1].div(totalTime[2]);


// user1 rut 2 - user 2 rut 1
totalTime[3] = (stake1[0].add(stake2[1]).add(stake3[0])).mul(60);
unitValue[3] = eth[2].div(totalTime[3]);


console.log(BigNumber.from("58947368421055800000")
            .add(BigNumber.from("13121652639631760000"))
            .sub(BigNumber.from("72069021060687560000"))
            .toString()
);

console.log(stake3[0].mul(60).mul(unitValue[3]).sub(BigNumber.from("58947368421055800000")).toString());