# Sequencer API

生成元は `tools/build-animation-sequence.mjs`。実装namespaceは `monolith_anim`、利用側のtimelineは任意namespaceに置けます。エンジンのload/tickはパック側が呼びます。

## 定義と再生

利用側loadからDefinitionを登録します。`id` と `definition` が必須で、definitionの省略項目には既定値が入ります。

```mcfunction
function monolith_anim:sequence/define {id:"dungeon:attack",definition:{tick:"dungeon:sequence/attack/tick",duration:60,priority:10,slot:0,on_complete:"dungeon:sequence/attack/complete"}}
execute as @e[tag=my_boss,limit=1] at @s run function monolith_anim:sequence/start {id:"dungeon:attack"}
```

定義の既定値は `duration:0`、`priority:0`、`slot:-1`、tick/callbackは何もしないfunction。callback名は `on_complete` / `on_cancel` / `on_pause` / `on_resume`。登録内容は開始時にInstanceへコピーされるため、定義の再登録は既存Instanceの期間やcallback参照を変更しません。参照先mcfunctionの内容変更は既存Instanceにも反映されます。

`start`のfunction戻り値およびOwnerの `ml_seq_result` は、成功なら正のInstance IDです。以降の開始APIで上書きされるため、外部制御で使用するIDは利用側scoreへ保存してください。

| 失敗値 | 意味 |
| --- | --- |
| -1 | 定義なし、実行者なし等 |
| -2 | 期間・Priority・Slot・modeの範囲不正 |
| -3 | Childの実行コンテキスト不正、またはPriority不足 |
| -4 | Instance数またはID上限 |
| -5 | 所有Slotの競合 |
| -6 | 同じOwnerの開始処理/callback中にinterruptを再入呼び出し |

Macro引数・function名・定義のNBT型は利用側の責任で正しく指定してください。型や必須引数の誤りはMinecraft自身のコマンドエラーになり得ます。

## 1 Sequence = 1 tick.mcfunction

```mcfunction
# dungeon:sequence/attack/tick
# --- 0t : Windup ---
execute if score @s ml_seq_time matches 0 run function monolith_anim:layer/start {slot:0,property:"rotation_y",from:0,to:90000,duration:20,easing:"out_quad"}
# --- 20t : Attack ---
execute if score @s ml_seq_time matches 20 run function dungeon:boss/attack
# --- 60t : Complete ---
execute if score @s ml_seq_time matches 60 run function monolith_anim:sequence/complete
```

timelineとcallbackは **Ownerを実行者・位置** として呼びます。`ml_seq_time` はそのInstanceの時刻です。Particle、Sound、任意function、Layer/Path APIを通常のmcfunctionとして記述できます。

開始したInstanceは次tickから `0` を実行し、`duration` を含む最後の時刻まで進みます。明示completeがなければ最後の時刻の処理後に自動完了します。`duration:0` でも0tを1回実行します。Pause/Waitに入った時刻は消費済みとし、復帰時にそのイベントを再実行しません。最後の時刻にwaitした場合は子の終了後に完了します。

## 子Sequenceと割り込み

timeline/callback内の現在Instanceから子を開始します。

```mcfunction
function monolith_anim:sequence/child {id:"dungeon:charge",mode:"parallel"}
function monolith_anim:sequence/child {id:"dungeon:attack",mode:"wait"}
function monolith_anim:sequence/child {id:"dungeon:recover",mode:"replace"}
```

- `parallel`：親を進めたまま独立Instanceを開始。
- `wait`：親を停止し、子の完了・Cancel・Replace先の終了後に次時刻から再開。
- `replace`：現在InstanceをCancel理由3で終了して置換。現在Instanceを待つ別のInstanceがあれば、その待機先を置換先へ引き継ぎます。

外部イベントでは対象Ownerとしてinterruptを呼びます。

```mcfunction
execute as @e[tag=my_boss,limit=1] at @s run function monolith_anim:sequence/interrupt {id:"dungeon:hit",mode:"pause"}
```

`parallel` は並列開始、`pause` は既存の待機関係を保って停止し割り込み終了後に復帰、`cancel` / `replace` は既存Instanceを終了して新Instanceを開始します。`cancel` の終了理由は2、`replace` は3です。どちらも `on_cancel` を呼び、`on_complete` は呼びません。

interruptはOwnerの既存Instance全体を対象とし、1つでも新定義より高Priorityなら全操作を拒否します。待機中・手動Pause中もPriorityを保持します。同じPriorityは許可。通常の `start` と `child` はこの割り込みPriority判定を行いません。

同Ownerの開始処理で発生したcallbackからの再帰interruptは `-6` で拒否します。callbackから通常start/controlは可能ですが、新たなinterruptは利用側の次tickイベントに回してください。開始処理完了後の通常のネスト割り込みは可能です。

## 完了・Cancel・Pause・Resume

timeline/callbackの現在Instanceには引数なしで呼びます。

```mcfunction
function monolith_anim:sequence/complete
function monolith_anim:sequence/cancel
function monolith_anim:sequence/pause
function monolith_anim:sequence/resume
```

外部からはOwnerとしてIDを指定します。

```mcfunction
function monolith_anim:sequence/control {instance:12,action:"resume"}
```

`action` は `complete` / `cancel` / `pause` / `resume`。他OwnerのIDには作用しません。手動Pauseと子・割り込み待機は別状態なので、resumeで子待ちを飛ばすことはできません。終了callbackは一度だけ発火します。

callback実行中の `ml_seq_reason` は1=Complete、2=Cancel、3=Replace、4=Pause、5=Resume。timelineは0。ネストしたcallbackから戻るとOwnerの公開時刻とエンジンの現在Instanceを復元します。mcfunction自体を途中で止める機能ではないため、complete/cancelの後に書いた同じtimeline内の行は通常通り実行されます。必要なら利用側で `return` してください。

## Layer所有とTransform階層

Definitionの `slot:0..3` はOwner上のその1Slotを予約します。同じOwnerの別Instanceによる重複予約は拒否します。timelineのLayer/Path呼び出しには同じslotを明示してください。`slot:-1` は予約なし・timelineのみです。

- Pause/Wait：予約SlotのTweenも停止。
- Resume：予約Slotを再開。
- Complete：現在値を残し、Slot予約を解放。未完了Tweenは引き続き進みます。
- Cancel/Replace：予約Slotをclearし、予約を解放。

割り込み演出は別Slotを使用してください。standalone Layer APIによる同Slotの上書きまでは禁止しません。1つのSequenceが複数Slotを操作する場合、予約Slot以外の停止・消去は利用側callbackで明示します。

BossRoot / OrbitRoot / BlockDisplayそれぞれをOwnerとして独立Sequenceを開始できます。SequenceはTransform階層を変更せず、Node側で親→子の合成を行います。Missing Parent時のNode停止とは独立にSequence時刻は進みます。

## 運用と制約

- 期間0〜2,000,000tick、Priority ±1,000,000。逆再生、Loop、Playback Rateは未実装。
- 最大64Instance/Owner、256ロード済みInstance/次元。callback/requestネスト上限16。深すぎるcallbackは省略し、状態の終了と後処理は続行。
- Marker1体/Instance。通常・Pause中とも同一次元のOwnerへ追従します。forceloadは行いません。Marker自身がアンロードされると更新されず、再ロードまで停止します。
- ロード済みInstanceからOwnerが見つからなければCancelして解放。Owner不在時はcallback・Layer操作不可。Ownerが戻って再びAPIを呼ぶと古いSlot予約を整理します。次元移動の追跡は非対応。
- 終了Instanceを待つ親は終了理由によらず復帰。parallelで開始した子は独立し、親だけをcontrol/cancelしても子は終了しません。Owner全体のinterrupt/cancelは子も対象。
- `/reload` は生存Instanceの時刻・待機関係・IDを保持。ロード関数の実行中コンテキストだけ初期化。
- Timeline/Callbackは任意functionを同期実行するため、非常に重い利用側処理はtick負荷に直接反映されます。

生成は `node tools/build-animation-sequence.mjs`。ユーザー指示により最終修正後の検証は未実行です。`tools/test-animation-sequence.mjs` は生成mcfunctionを読む軽量実行器のテストで、Minecraft上の確認を代替しません。
