const {BigNumber} = require("ethers");

let stake1 = [BigNumber.from("10"), BigNumber.from("30")];
let timestake1 = [BigNumber.from("1613817976"), BigNumber.from("1613818034")];
let stake2 = [BigNumber.from("50"), BigNumber.from("10")];
let timestake2 = [BigNumber.from("1613817996"), BigNumber.from("1613818039")];
let stake3 = [BigNumber.from("60")];
let timestake3 = [BigNumber.from("1613818044")];
let distime = [BigNumber.from("1613818030"), BigNumber.from("1613818091"), BigNumber.from("1613818151")];
let eth = [BigNumber.from("60000000000000000000"), BigNumber.from("100000000000000001600"), BigNumber.from("80000000000000003000")];

// test 1 
let totaltime = (stake1[0].mul(61)).add((distime[1].sub(timestake1[1])).mul(stake1[1]))
                .add(stake2[0].mul(61)).add((distime[1].sub(timestake2[1])).mul(stake2[1]))
                .add((distime[1].sub(timestake3[0])).mul(stake3[0]));
let unitvalue = eth[1].div(totaltime);
console.log(totaltime.toString());
let rw1_1 = unitvalue.mul(stake1[0].mul(61));
let rw1_2 = unitvalue.mul((distime[1].sub(timestake1[1])).mul(stake1[1]));
let rw2_1 = unitvalue.mul(stake2[0].mul(61));
let rw2_2 = unitvalue.mul((distime[1].sub(timestake2[1])).mul(stake2[1]));
let rw3 = unitvalue.mul((distime[1].sub(timestake3[0])).mul(stake3[0]));
console.log(`user1 rut 2: ${rw1_2}`);
console.log(`user2 rut 1: ${rw2_1}`);


//test2
let totaltime2 = (stake1[0].add(stake2[1]).add(stake3[0])).mul(60);
let unitvalue2 = eth[2].div(totaltime2);
console.log(totaltime2.toString());
let money1 = (unitvalue2.mul(stake1[0]).mul(60)).add(rw1_1);
let money2 = (unitvalue2.mul(stake2[1]).mul(60)).add(rw2_2);
let money3 = (unitvalue2.mul(stake3[0]).mul(60)).add(rw3);
console.log(`money1: ${money1}`);
console.log(`money2: ${money2}`);
console.log(`money3: ${money3}`);