# Monolith Datapack

Minecraft Java Edition 26.1向けのデータパックです。リソースパック本体とは分離し、ワールドの`datapacks/Monolith`からこのフォルダへシンボリックリンクして使用します。

再読み込みは`/reload`、リソースパックの再読み込みは`F3 + T`です。

## 視覚テスト

プレイヤーとして以下を実行すると、視線方向の前方に比較用Display Entityが生成されます。

```mcfunction
/function monolith:animation/debug/translation
/function monolith:animation/debug/scale
/function monolith:animation/debug/all
/function monolith:animation/debug/rotation
/function monolith:animation/debug/reset
```

`translation`は5個のブロックを同じ距離だけ上昇させ、`scale`は5個のブロックを同じ倍率まで拡大します。左から`linear`、`in_quad`、`out_quad`、`in_out_quad`、`out_back`です。

利用可能なEasingは`linear`、`in_quad`、`out_quad`、`in_out_quad`、`in_cubic`、`out_cubic`、`in_out_cubic`、`in_back`、`out_back`、`in_out_back`、`out_bounce`、`in_bounce`、`in_out_bounce`です。

`all`は全13種類を同時に上昇させます。プレイヤーの視線方向を基準に、次の配置です。

```text
奥:   in_out_bounce
      out_bounce      in_bounce       in_out_back
      in_back         out_back        in_out_cubic
      in_cubic        out_cubic       in_out_quad
手前: in_quad         out_quad        linear
```

`rotation`は横長のDisplay EntityをY軸方向へ0度から180度まで回転させ、`linear`、`in_out_cubic`、`out_back`を比較します。回転値はミリ度で、`90000`が90度です。Propertyには`rotation_x`と`rotation_y`を指定できます。
