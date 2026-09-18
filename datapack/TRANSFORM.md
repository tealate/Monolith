# Transform Tracks / Path / Virtual Parent

この文書は互換維持する旧 `monolith:animation/*` APIです。XYZ独立Layer・Transform階層・Sequencerを使う新規実装は [ANIMATION.md](ANIMATION.md) の `monolith_anim:*` を参照してください。旧APIは登録済みの新Nodeへの書き込みを拒否します。

対象はMinecraft Java Edition **26.1**。既存の `animation/start` を維持し、Translation / Rotation / Scaleの3Trackを独立させています。
仕様参照：[2026-09-17拡張設計を含むNotion仕様書](https://app.notion.com/p/3dd1fd1a615181308b58f0fd8362912a)。

## 最初に試す

`/reload` 後、開けた場所で以下のいずれかを実行します。各デモ開始時は既存の `monolith.debug` Entityを片付けます。

| Function（先頭に `/function monolith:animation/debug/`） | 確認すること |
| --- | --- |
| `transform` | 白=Linear、金=Arc、アメジスト=Bezier。全て移動・720度回転・拡大を独立した時間で同時再生 |
| `world` | 両方Yaw=90度。白はWorld +Zへ、金はLocal +Zへ移動。回転・拡大も同時再生 |
| `player_parent` | 歩く・視点を上下左右に動かす。白=位置のみ/feet、金=yaw/feet、紫=full_rotation/eyes |
| `boss_parent` | 10秒間移動・回転するMarkerのBossRootに、回転するCore・伸びる左右パーツ・跳ぶ上パーツが追従 |
| `cancel_tracks` | 子の全Tweenを現在値で止める。Parent追従は続く |
| `detach` | 今の見た目を保ってParentから切り離す。残りのTweenは続く |
| `remove_boss_parent` | BossRootを削除する。子の全Tweenと追従が停止することを確認 |
| `reset` | デモEntityを削除 |

Playerデモは足元/目線を原点として約3〜4.5ブロック前に表示されます。Tween終了後も親追従は継続します。
各デモは再実行可能。既存 `translation` / `scale` / `all` / `rotation` / `showcase` も維持しています。

## 独立した3Track

以下を同一Display Entityを実行者として続けて呼び出せます。

```mcfunction
function monolith:animation/start {property:"translation_y",from:0,to:3000,duration:60,easing:"out_quad"}
function monolith:animation/start {property:"local_rotation_y",from:0,to:720000,duration:100,easing:"linear"}
function monolith:animation/start {property:"scale_xyz",from:300,to:1000,duration:40,easing:"out_back"}
```

- 値はTranslation/Scaleが1000倍、角度がミリ度（90000=90度）、進捗が10000倍。
- 同じTrackへの再開始はそのTrackだけ上書き。異なるTrackは継続。
- TranslationのX/Y/Zは同一Track。複数軸移動には下記Pathを使う。
- Rotationは1軸ずつ。任意のEuler XYZ同時合成・Quaternion間SLERPは今回の対象外。
- Scaleは `scale_x/y/z` または均等な `scale_xyz`。
- `duration <= 0` は即時To。終了時は丸めを経由せず正確なToを適用。
- `animation/cancel` は全Track、`cancel_translation` / `cancel_rotation` / `cancel_scale` は単一Trackを現在値で停止。
- `animation/finish` は全稼働TrackをToへスナップして終了。

## Translation Path

既存31種類のEasingを `easing` で選択。以下のFunctionはTranslation Trackだけを開始します。

```mcfunction
function monolith:animation/path/linear {space:"local",sx:0,sy:0,sz:0,ex:0,ey:2000,ez:4000,duration:60,easing:"out_quart"}
function monolith:animation/path/arc {space:"local",sx:0,sy:0,sz:0,ex:0,ey:0,ez:4000,height:2500,duration:60,easing:"linear"}
function monolith:animation/path/bezier {space:"local",sx:0,sy:0,sz:0,cx:3000,cy:4000,cz:2000,ex:0,ey:0,ez:4000,duration:60,easing:"in_out_sine"}
```

`sx/sy/sz` はStart、`ex/ey/ez` はEnd、`cx/cy/cz` はControl。
Arcは `lerp(Start,End,u) + (0,4*height*u*(1-u),0)`。
Bezierは二次式と等価なde Casteljau法で計算します。
Easingの出力はClampしません。Back/ElasticのOvershootはPathの外挿にも反映されます。

| space | 適用先と意味 |
| --- | --- |
| `local` | `transformation.translation`。Display本体またはVirtual Parentの向きを基準とするモデルXYZ |
| `world` | Display本体の `Pos`。引数は1000倍の絶対ワールド座標。開始時にモデルtranslationを0へ戻す |

Local +Xはモデルの+Xで、コマンドの `^+X`（左方向）とは一致しません。Local +Y=上、+Z=前方（本体Yaw=Pitch=0時）。
親無しLocalは現在のDisplay本体を原点にします。親付きWorldでは位置を親に上書きされず、親の回転継承だけを続けます。
Worldで `ex:100000` はX=100ブロックです。`debug/world` は現在の位置から絶対座標を組み立てる参考例です。

## Virtual Parent API

親を選択してから、対象Childにbindします。セレクタは一意になるよう指定してください。

```mcfunction
# Playerを親にする（コマンド実行者がPlayerの場合）
function monolith:animation/parent/select
execute as @e[type=minecraft:block_display,tag=my_child] run function monolith:animation/parent/bind {mode:"yaw",anchor:"feet"}

# BossRootを親にする
execute as @e[type=minecraft:marker,tag=my_boss_root,limit=1] run function monolith:animation/parent/select
execute as @e[type=minecraft:block_display,tag=my_boss_child] run function monolith:animation/parent/bind {mode:"full_rotation",anchor:"feet"}
```

`select` は親に永続IDを割り当て、そのIDを次のbind用に選択します。複数の親を使う場合はselect→bindを組ごとに続けて呼びます。
`#selected ml_parent_id` は即時引き渡し用の共有値です。別tickを挟んで選択状態が保持されると想定しないでください。

- `position_only`：位置を継承し、子の本体Rotationを保持。
- `yaw`：位置と親Yawを継承し、子本体Pitchを0にする。
- `full_rotation`：位置と親Yaw/Pitchを継承。
- `anchor:"feet"` または `anchor:"eyes"`（Playerの姿勢による目線高さも実行コンテキストを利用）。
- Parent Scaleは継承しない。子のScale Trackは独立。
- Parentは同一次元内のロード済みEntity/オンラインPlayer。見つからなければ子の全Trackを一時停止し、同じ親IDが復帰すると再開。
- 別の親を勝手に代用しない。次元をまたぐParentの転送追跡・複数階層Parentは非対応。ChildをさらにParentとして登録することは拒否する。
- bindした親は `monolith.parent` タグ、子は `monolith.child` タグと `ml_parent_ref` を持つ。
- `animation/parent/unbind` は現在のPos/Rotation/Transformを保って解除。Tweenは続行。
- 使い終わった親から `tag <parent> remove monolith.parent` で追従検索を止められる。再利用時はselectで再登録する。

## Parentと回転の合成

Parent RotationはDisplay本体の `Rotation[]`、子の `local_rotation_x/y/z` は `transformation.left_rotation` を担当します。
各Local Rotation AdapterはそのQuaternion全体を所有し、`right_rotation` は変更しません。
既存 `rotation_x/y` は親無しでは従来の本体Pitch/Yaw、親付きではLocal Rotationへ変換します。親解除後も進行中のTrackはLocalのまま完走します。

Quaternionは角度を1度区切りで事前計算し、ミリ度の端数を線形補間します。1更新あたり固定インデックス引数のMacroを1回使用します。
新しいPath計算・Track更新・親の座標/回転追従は通常Functionです。既存EasingのLUT Macro方式は維持しています。

## 数値範囲と運用

- scalar from/to：±1,000,000（角度なら±1000度、距離なら±1000ブロック）。
- Path各座標：±100,000,000（±100,000ブロック）。Arc height：±100,000（±100ブロック）。
- duration上限：200,000 tick。範囲外は開始を拒否し、既存Trackを維持。
- 入力は整数。Macroの必須引数欠落・未知の名前はMinecraftのエラーになるため、この文書の引数をすべて指定。
- 固定小数点演算で1/1000ブロック程度の丸めが発生します。終点は指定値を再適用します。
- 親×子のID照合はタグで絞って走査。大量の親子を数千体規模で使う場合は別途性能測定が必要。
- Vanillaの3次元をtick。カスタム次元はルートtickに明示追加する。
- `/reload` はTrackをリセットしない。旧1Track状態をロード済み対象について移行する。

## 検証・再生成

```powershell
node tools/build-transform.mjs
node tools/build-transform-debug.mjs
node tools/test-transform.mjs
```

生成元はプロジェクトルートの `tools/`。生成ファイルの直接変更ではなく生成元を編集します。
回帰テストは実mcfunctionのscoreboard・Macro・NBT更新を小さな実行器で読み、Trackの独立性、Path数値、キャンセル、親追従コマンド、回転の独立性を確認します。
Minecraftのコマンドパーサ・実クライアント描画を代替するものではありません。
既存31曲線も数値照合し、InOutの二重分岐、Cubic/Backの定数、Quint後半の符号を修正しています。
既存Circ系41点LUTの最大近似誤差は今回のサンプルで約0.0555。精度改善は別途可能です。
