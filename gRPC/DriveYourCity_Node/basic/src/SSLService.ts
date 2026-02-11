// @ts-ignore
import path from 'path'
import {ChannelCredentials, ServerCredentials} from "@grpc/grpc-js";
import * as fs from "fs";

export class SSLService {
    static getServerCredentials(): ServerCredentials {
        const serverCert = fs.readFileSync(path.resolve(__dirname, '../../ssl/server-cert.pem'));
        const serverKey = fs.readFileSync(path.resolve(__dirname, '../../ssl/server-key.pem'));

        const serverCredentials = ServerCredentials.createSsl(
            null,
            [
                {
                    cert_chain: serverCert,
                    private_key: serverKey,
                },
            ],
            false
        );

        return serverCredentials;
    }

    static getChannelCredentials(): ChannelCredentials {
        const rootCert = fs.readFileSync(path.resolve(__dirname, '../../ssl/ca-cert.pem'));

        // If you use CA root certificate
        // const channelCredentials = ChannelCredentials.createSsl();

        // If you use Self-Signed root certificate you need to provide it
        const channelCredentials = ChannelCredentials.createSsl(rootCert);

        return channelCredentials;
    }
}
