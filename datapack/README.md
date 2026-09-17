# Monolith Datapack

## 浮遊コアの展開・収束サンプル

`/reload` → `/function monolith:animation/debug/sentinel`

前方8ブロック・高さ2.5ブロックに光るコアと4つの破片が出現します。
約6秒で、弾むように拡大 → 弧を描いて展開 → 親ごと旋回しながら個別回転 → Bezier曲線で収束 → 縮小消滅。
音・Particle付き。終了時には親Markerと子Displayを自動削除します。
再実行でこのサンプルだけ作り直せます。途中で片付ける場合は `/function monolith:animation/debug/reset`（他のdebugサンプルも削除）。

Translation / Rotation / Scaleの同時Tween、3種類のPath、Player/BossRootの親追従を追加しました。
API・座標空間・制約・確認方法は [TRANSFORM.md](TRANSFORM.md) を参照してください。
最初の確認：`/reload` → `/function monolith:animation/debug/transform`。

## クリスタル登場デモ

`/reload`後に`/function monolith:animation/debug/showcase`を実行。
前方6ブロックにアメジスト・シーランタン・金のDisplayが時間差で出現し、
拡大 → 上昇 → 540度回転 → バウンド着地 → 縮小消滅を約8秒で再生する。
既存のout_back / out_quart / out_bounce / in_quartを使用する。
音とParticle付き。再実行でこのデモを作り直し、終了時は自動削除する。
途中停止は`/function monolith:animation/debug/reset`（他の比較サンプルも削除）。
ゲーム内の見え方は未確認。

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

利用可能なEasingは`linear`に加え、Sine、Quad、Cubic、Quart、Quint、Expo、Circ、Back、Elastic、Bounceそれぞれの`in_*`、`out_*`、`in_out_*`です（合計31種類）。

`all`はeasings.net掲載の全30種類と`linear`を、5列のグリッドで同時に上昇させます。

`rotation`は横長のDisplay EntityをY軸方向へ0度から180度まで回転させ、`linear`、`in_out_cubic`、`out_back`を比較します。回転値はミリ度で、`90000`が90度です。Propertyには`rotation_x`と`rotation_y`を指定できます。
