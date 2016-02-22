block=$1
blockhash=$(dcrctl --wallet getblockhash $block);
dcrctl --wallet getblock $blockhash
