import {
    rpc,
    TransactionBuilder,
    Networks,
    Contract,
    Account,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    xdr,
    scValToNative,
} from '@stellar/stellar-sdk';

async function main() {
    const server = new rpc.Server('https://soroban-testnet.stellar.org');
    const contractId = 'CCGDFDLPELTOWG5H5OA4MBR5OZWDP4XJI3S3TQZVZ7XTVP77EKOFORYF';
    const sourceAddress = 'GAJRNUO6HSMQG4FNHNWQVRXJZJZ7QRA7HXPYYB6H5PTA3EAAJXJNZD7U';

    const sourceAccount = new Account(sourceAddress, '0');
    const contract = new Contract(contractId);

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
    })
        .addOperation(contract.call('get_owner'))
        .setTimeout(0);

    try {
        const sim = await server.simulateTransaction(txBuilder.build());
        // eslint-disable-next-line no-undef, no-console
        console.log('SIM:', JSON.stringify(sim, null, 2));
        if (sim.result && sim.result.retval) {
            // eslint-disable-next-line no-undef, no-console
            console.log('PARSED ALREADY:', scValToNative(sim.result.retval));
        } else if (sim.results && sim.results.length > 0) {
            // eslint-disable-next-line no-undef, no-console
            console.log('RESULTS ARRAY DETECTED!');
        }
    } catch (e) {
        // eslint-disable-next-line no-undef
        console.error('ERROR:', e);
    }
}
main();
