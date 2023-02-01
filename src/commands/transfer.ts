import { AssetValue, GrumpkinAddress, TxSettlementTime } from "@aztec/sdk";
import { BaseCommand } from "../base.js";
// import { Flags} from "@oclif/core";
import { Flags } from "../flags.js";
import networkConfig from "../network_config.js";
import { parseAztecRecipient, parseTime } from "../utils.js";
import GetFees from "./getfees.js";

export default class Transfer extends BaseCommand {
  static description = "Transfer funds on the Aztec network.";

  static examples = [
    "azteccli transfer 0.1 -r theiralias",
    "azteccli transfer 1 -r 0x20e4fee0dace3d58b5d30a1fcd2ec682581e92ccd1b23f9a25b007097c86cd61033293008cb23cc99c07a6c9f6e7d9edd6a46373f7f01b9e7c2b67464690066f",
    "azteccli transfer 1 -r theiralias --time instant --customAccountMessage 'custom account derivation message' --customSignerMessage 'custom signer derivation message'",
    "azteccli transfer 1 -r theiralias --asset dai --accountKey 23ffa7b774a1263e51d34f11b99cd78cbb3ad8de6f4203ea393c8de1a1be05d9 --signingKey 0c5e934c191d9b0ad2bd07d5042414efc4a1523b465648918a678cbd6fb5b241",
  ];

  static flags = {
    ...BaseCommand.flags,
    asset: Flags.asset(),
    time: Flags.time,
    recipient: Flags.recipient({
      required: true,
    }),
    customAccountMessage: Flags.customAccountMessage,
    accountKey: Flags.accountKey,
    useAccountKeySigner: Flags.useAccountKeySigner,
    signingKey: Flags.signingKey,
    customSignerMessage: Flags.customSignerMessage,
    spendingKeyRequired: Flags.spendingKeyRequired,
  };

  static args = [{ name: "amount", required: true }];

  public async run(): Promise<void> {
    const { time, recipient, asset, spendingKeyRequired } = this.flags;
    const { amount } = this.args;

    let settlementTime = parseTime(time);

    const accountKeys = await this.getAccountKeysAndSyncAccount();

    let to = await parseAztecRecipient(recipient, accountKeys, this.sdk);

    const signer = await this.getSigner();

    const tokenQuantity = BigInt((amount as number) * 10 ** 18);
    const tokenAssetId = this.sdk.getAssetIdBySymbol(asset.toUpperCase());

    const tokenAssetValue: AssetValue = {
      assetId: tokenAssetId,
      value: tokenQuantity,
    };

    const feeOptions = {
      userId: accountKeys.publicKey,
      userSpendingKeyRequired: true,
      excludePendingNotes: true,
      feeSignificantFigures: 2,
      assetValue: tokenAssetValue
    }

    const tokenTransferFee = (await this.sdk.getTransferFees(tokenAssetId, feeOptions))[
      settlementTime
    ];

    const tokenTransferController = this.sdk.createTransferController(
      accountKeys.publicKey,
      signer,
      tokenAssetValue,
      tokenTransferFee,
      to,
      spendingKeyRequired
    );

    await tokenTransferController.createProof();
    let txId = await tokenTransferController.send();
    this.log(
      "View transaction on the block explorer",
      `${networkConfig[this.chainId].explorerUrl}tx/${txId.toString()}`
    );
  }
}
