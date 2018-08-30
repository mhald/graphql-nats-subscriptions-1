import { PubSubEngine } from 'graphql-subscriptions';
export interface NatsPubSubOptions {
    natsUrl?: string;
}
export declare class NatsPubSub implements PubSubEngine {
    private nats;
    constructor(options?: NatsPubSubOptions);
    publish(subject: string, payload: any): boolean;
    subscribe(subject: string, onMessage: Function): Promise<number>;
    close(): void;
    unsubscribe(sid: number): void;
    asyncIterator<T>(subjects: string | string[]): AsyncIterator<T>;
}
