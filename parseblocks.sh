block=$1
blockhash=$(dcrctl getblockhash $block);
dcrctl getblock $blockhash
