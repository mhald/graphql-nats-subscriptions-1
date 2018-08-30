import { PubSubEngine } from 'graphql-subscriptions';
export interface StanPubSubOptions {
    natsUrl: string;
    clusterId: string;
    clientId: string;
}
export declare class StanPubSub implements PubSubEngine {
    private options;
    private stanClient;
    private subscriptions;
    private nextSubscriptionNumber;
    constructor(options: StanPubSubOptions);
    connect(): Promise<{}>;
    publish(subject: string, payload: any): boolean;
    subscribe(subject: string, onMessage: Function, options: any): Promise<number>;
    close(): void;
    unsubscribe(sid: number): void;
    asyncIterator<T>(subjects: string | string[], options?: any): AsyncIterator<T>;
}
