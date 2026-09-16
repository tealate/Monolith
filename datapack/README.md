# Monolith Datapack

Minecraft Java Edition 26.1向けのデータパックです。リソースパック本体とは分離し、ワールドの`datapacks/Monolith`からこのフォルダへシンボリックリンクして使用します。

再読み込みは`/reload`、リソースパックの再読み込みは`F3 + T`です。

## 視覚テスト

プレイヤーとして以下を実行すると、視線方向の前方に比較用Display Entityが生成されます。

```mcfunction
/function monolith:animation/debug/translation
/function monolith:animation/debug/scale
/function monolith:animation/debug/reset
```

`translation`は5個のブロックを同じ距離だけ上昇させ、`scale`は5個のブロックを同じ倍率まで拡大します。左から`linear`、`in_quad`、`out_quad`、`in_out_quad`、`out_back`です。

利用可能なEasingは`linear`、`in_quad`、`out_quad`、`in_out_quad`、`in_cubic`、`out_cubic`、`in_out_cubic`、`in_back`、`out_back`、`in_out_back`、`out_bounce`、`in_bounce`、`in_out_bounce`です。
