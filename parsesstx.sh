txid=$1
dcrctl decoderawtransaction $(dcrctl getrawtransaction $txid)
