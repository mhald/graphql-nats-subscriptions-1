import * as stan from "node-nats-streaming";
import { PubSubEngine } from 'graphql-subscriptions';
import { PubSubAsyncIterator } from './pubsub-async-iterator';

export interface StanPubSubOptions {
  natsUrl: string;
  clusterId: string;
  clientId: string;
}

export class StanPubSub implements PubSubEngine {
  private options: StanPubSubOptions;

  private stanClient: stan.Stan;

  private subscriptions = new Map<number, stan.Subscription>();
  private nextSubscriptionNumber = 1;

  constructor(options: StanPubSubOptions) {
    this.options = options;
  }

  async connect() {
    const self = this;
    return new Promise((resolve, reject) => {
      const maybeClient = stan.connect(this.options.clusterId, this.options.clientId, { url: this.options.natsUrl });
      maybeClient.on("connect", () => {
        maybeClient.removeAllListeners("error");
        self.stanClient = maybeClient;
        resolve();
      });
      maybeClient.on("error", err => {
        reject(err);
      })
    });
  }

  publish(subject: string, payload: any): boolean {
    this.stanClient.publish(subject, JSON.stringify(payload));
    return true
  }

  subscribe(subject: string, onMessage: Function, options: any): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const subOpts = this.stanClient.subscriptionOptions();
      subOpts.setManualAckMode(true);
      if (options && options.startTime) {
        // options.startTime is expected to be in unix millis
        const startDate = new Date(options.startTime);
        subOpts.setStartTime(startDate);
      }
      const sub = this.stanClient.subscribe(subject, "", subOpts);
      sub.on("ready", () => {
        sub.on("message", (msg: stan.Message) => {
          const data = msg.getData() as string;
          const timestamp = msg.getTimestamp().valueOf();
          const result = { timestamp: timestamp, data: JSON.parse(data) };
          onMessage(result);
          msg.ack();
        });
        const subNum = this.nextSubscriptionNumber;
        this.nextSubscriptionNumber += 1;
        this.subscriptions.set(subNum, sub);
        resolve(subNum);
      })
      sub.on("error", err => {
        reject(err);
      });
    });
  }

  public unsubscribe(sid: number) {
    const sub = this.subscriptions.get(sid);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(sid);
    }
  }

  public asyncIterator<T>(subjects: string | string[], options?: any): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, subjects, options)
  }
}
