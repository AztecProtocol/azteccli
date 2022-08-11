import { GrumpkinAddress } from "@aztec/sdk";
import { BaseCommand } from "../base";
import { Flags } from "../flags";

export default class AccountInfo extends BaseCommand {
  static description =
    "Print total balance, spendable balance associated with the privacy account and spendable balance associated with spending keys.";

  static flags = {
    ...BaseCommand.flags,
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
  };

  static examples = [
    "azteccli accountinfo",
    "azteccli accountinfo -m 'custom account key derivation message'",
    "azteccli accountinfo --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9",
  ];

  static enableJsonFlag = true;

  public async run(): Promise<{ publicKey: string}> {
    let accountKeys = await this.getAccountKeys();

    this.log(
      "Aztec account public key (GrumpkinAddress)",
      accountKeys!.publicKey.toString()
    );

    await this.sdk.destroy();
    return { publicKey: accountKeys!.publicKey.toString()}
  }
}
