const fs = require('node:fs');
const superagent = require('superagent');

const TARGET_USER = 'thomaswmy';
const data = fs.existsSync('data.json') ? JSON.parse(fs.readFileSync('data.json').toString()) : [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    for (let page = 1; ; page++) {
        console.info(`page ${page}`);
        const { body } = await superagent.get('https://www.luogu.com.cn/record/list')
            .query({
                user: TARGET_USER,
                page,
                _contentOnly: true,
            })
            .set('Cookie', JSON.parse(fs.readFileSync('secret.json')));
        if (body.code !== 200) throw new Error('Status is not 200');
        const records = body.currentData.records.result;
        let newRecord = false, duplicate = false;
        for (const rdoc of records) {
            rdoc.user = rdoc.user.name;
            if (data.find((r) => r.id === rdoc.id)) duplicate = true;
            else newRecord = true, data.push(rdoc);
        }
        fs.writeFileSync('data.json', JSON.stringify(data, null, '  ').sort((x, y) => x.id - y.id));
        if (!newRecord || duplicate) break;
        await sleep(3000);
    }
}

main();
