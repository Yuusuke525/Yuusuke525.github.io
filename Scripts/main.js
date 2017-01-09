
//グローバル変数(変わる可能性が高いから置いているだけ)
const g_sheet_id = '1NOhzMLP-mN3YKqbQspTnDv_1TPZRyv-DX8X5yy8jluc';
const g_drop_table_sheet_id = 'o9fvem0';
const g_hunt_area_table_sheet_id = 'op2y3i9';


//main
$(function () {

    //初期化==========================
    let parent = document.getElementById("test_field");

    //狩場のドロップダウンメニュー
    let select_menu_id = "#select_hunt_area";

    //テーブルの列のカウント
    let table_row_count = 0;
    
    //すべてのテーブルのデータ
    let data_table = null;
    //選択された狩場のテーブルのデータ
    let select_drop_table = [];
    //データのロード
    (LoadAllData())
        .then((data) => {
            //成功時の処理
            console.log("読み込み終了！");
            data_table = CreateTables(data);
            console.log("すべてのテーブルの作成を終了");

            $(select_menu_id).empty();
            for (let i = 0; i < data_table.hunt_area_table.hunt_area.length; i++) {
                let key = data_table.hunt_area_table.hunt_area[i].id;
                let text = data_table.hunt_area_table.hunt_area[i].name;
                $(select_menu_id).append($('<option value="' + key + '">' + text + '</option>'));
            }
            console.log(data_table);
            
            let selected_val = parseInt(($(select_menu_id).val()), 10);
            select_drop_table = CreateSelectedData(data_table,selected_val)
            table_row_count = SetupTable(select_drop_table);
            console.log("ユーザー用テーブルの初期化が完了")
            console.log("全ての初期化が完了");

        });//エラーの場合、中でアラートが走るためこちらでは何もしない

    //================================
    
    //税率の初期値の設定とイベントの設定
    $('form').submit(function() {return false;});
    $('#tax_value').val(0);
    $('#tax_value').change(()=>{
        if($('#tax_value').val() ===""){
            $('#tax_value').val(0);
        }
        CountAllTales(select_drop_table,table_row_count);
        CountSum(table_row_count);
        CountMonyPerHour();
    });
    
    //狩時間の初期値の設定とイベントの設定
    $('#hunt_time').val(0);
    $('#hunt_time').change(()=>{
        if($('#hunt_time').val()===""){
            $('#hunt_time').val(0);
        }
        CountAllTales(select_drop_table,table_row_count);
        CountSum(table_row_count);
        CountMonyPerHour();
    });

    //時給の初期値の設定
    $('#money_per_hour').val(0);

    $(select_menu_id).change(() => {
        let selected_val = parseInt(($(select_menu_id).val()), 10);

        select_drop_table = CreateSelectedData(data_table, selected_val);
        console.log(select_drop_table);

        table_row_count = SetupTable(select_drop_table);
        console.log($('#items').html());
        
    });

});


//セルのデータ構造体==========================
class CellData {
    constructor(_comment, _row, _col) {
        this.comment = _comment;
        this.row = _row;
        this.col = _col;
        return this;
    }
}

//==========================================

//dataクラス==============
class SpledSheetDatas {

    //データの読み込み関数
    //.thenで受け取ってください
    static LoadData(_string_google_key, _string_sheet_id) {
        let url = "https://spreadsheets.google.com/feeds/cells/" + _string_google_key + "/" + _string_sheet_id + "/public/values?alt=json";
        console.log(url);
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'jsonp',
                timeout: 1000,
                success: (data) => {
                    //メインのデータを抽出
                    let sheets_entry = data.feed.entry;
                    let cell_datas = [];
                    for (const key of Object.keys(sheets_entry)) {
                        let celldata = sheets_entry[key].gs$cell;
                        cell_datas.push(new CellData(celldata.$t, celldata.row, celldata.col));
                    }
                    //抽出したデータを返す
                    resolve(cell_datas);
                },
                error: (err) => {
                    alert("通信エラー　データの取得に失敗。。。");
                    reject(err);
                }
            })
        });
    }

}

//=======================




//全てのデータの読み込み=====
//.thenで受け取ってください
const LoadAllData = () => {
    let data_array = new Array();

    return new Promise((resolve, reject) => {

        (SpledSheetDatas.LoadData(g_sheet_id, g_drop_table_sheet_id))
            .then((table) => {
                data_array.push(table);
                SpledSheetDatas.LoadData(g_sheet_id, g_hunt_area_table_sheet_id)
                    .then((item) => {
                        data_array.push(item);
                        resolve(data_array);
                    }, (err) => {
                        alert(err);
                        reject(err);
                    });
            }, (error) => {
                alert(error);
                reject(error);
            });

    });// /promise
}
//=======================


//すべてのテーブルの倉庫
class DataTable {
    constructor(_drop_table, _hunt_area_table) {
        this.drop_table = _drop_table;
        this.hunt_area_table = _hunt_area_table;
    }
}
//狩場テーブル=====
class HuntAreaTable {
    constructor() {
        this.hunt_area = [];
        this.region_area = [];
    }
}
//狩場
class HuntArea {
    constructor() {
        this.id = 0;
        this.name = "";
    }
}
//地域
class Region {
    constructor() {
        this.id = 0;
        this.name = "";
    }
}
//=================

//ドロップテーブル===
class DropTable {
    constructor() {
        this.drop_table_rows = [];
    }
}
//ドロップテーブル(１列分)
class DropTableRow {
    constructor() {
        this.item_name = "";
        this.sell_value = 0;
        this.trade_shop = false;
        this.region_id = [];
        this.hunt_area_id = [];//この下に10個配列でくっつける
    }
}
//==================

const CreateTables = (_datas) => {

    let hunt_area_table = CreateHuntAreaTable(_datas[1]);
    console.log("エリアのテーブルを作成完了");

    let drop_table = CreateDropTable(_datas[0]);
    console.log("ドロップアイテムのテーブルを作成完了");
    return new DataTable(drop_table, hunt_area_table);
}


//狩場テーブルの作成
const CreateHuntAreaTable = (_data) => {
    let hunt_area_table = new HuntAreaTable();

    //有効な狩場の列の最大値を取得
    let last_row_num = Enumerable.From(_data)
        .Where((record) => { return (record.col === "1"); })
        .Max((record) => record.row);

    //有効な全て狩場の列を取得
    let row_records = Enumerable.From(_data)
        .Where((record) => { return (parseInt(record.col, 10) <= 2) })
        .Where((record) => { return (record.row <= last_row_num); })

    for (let i = 2; i <= last_row_num; i++) {
        let row_record = Enumerable.From(row_records)
            .Where((record) => { return (record.row == i) })
            .ToArray();
        let create_hunt_area = new HuntArea();
        //idの設定
        if (row_record[0] == null) continue;
        create_hunt_area.id = parseInt(row_record[0].comment, 10);
        //名前の設定
        if (row_record[1] == null) continue;
        create_hunt_area.name = row_record[1].comment;
        //作ったのを配列に追加
        hunt_area_table.hunt_area.push(create_hunt_area);
    }
    //狩場のテーブルの完成


    //有効な領域の列の最大値を取得
    last_row_num = Enumerable.From(_data)
        .Where((record) => { return (record.col === "3"); })
        .Max((record) => record.row);

    //有効な全て領域の列を取得
    row_records = Enumerable.From(_data)
        .Where((record) => { return (parseInt(record.col, 10) <= 4) && (parseInt(record.col, 10) > 2) })
        .Where((record) => { return (record.row <= last_row_num); })

    for (let i = 2; i <= last_row_num; i++) {
        let row_record = Enumerable.From(row_records)
            .Where((record) => { return (record.row == i) })
            .ToArray();
        let create_region = new Region();
        //idの設定
        if (row_record[0] == null) continue;
        create_region.id = parseInt(row_record[0].comment, 10);
        //名前の設定
        if (row_record[1] == null) continue;
        create_region.name = row_record[1].comment;
        //作ったのを配列に追加
        hunt_area_table.region_area.push(create_region);
    }
    //領域のテーブルの完成


    return hunt_area_table;
}

//ドロップテーブルの作成
const CreateDropTable = (_data) => {
    let drop_table = new DropTable();
    //有効な列の最大値を取得
    let last_row_num = Enumerable.From(_data)
        .Where((record) => { return (record.col === "1"); })
        .Max((record) => parseInt(record.row, 10));
    //有効な全ての列を取得
    let row_records = Enumerable.From(_data)
        .Where((record) => { return (parseInt(record.row, 10) <= last_row_num); })

    //領域idの項目行
    let region_col = Enumerable.From(row_records)
        .Where((record) => { return (record.row == "1"); })
        .Where((record) => { return (record.comment === "region_id") })
        .Select((record) => record.col)
        .ToArray();

    //狩場idの項目行
    let hunt_area_col = Enumerable.From(row_records)
        .Where((record) => { return (record.row == "1"); })
        .Where((record) => { return (record.comment === "hunt_area_id") })
        .Select((record) => record.col)
        .ToArray();

    //取得した列から１列ずつ分解して構造体にぶち込んで行く
    //i=0は表の項目のため除外
    for (let i = 2; i <= last_row_num; i++) {
        let row_record = Enumerable.From(row_records)
            .Where((record) => { return (parseInt(record.row, 10) === i); })
            .ToArray();
        record_drop = new DropTableRow();
        //アイテム名の設定
        if (row_record[0] === null) continue;
        record_drop.item_name = row_record[0].comment;
        //販売価格の設定
        if (row_record[1] === null) continue;
        record_drop.sellvalue = RemoveFigure(row_record[1].comment);
        //取引所フラグの設定
        if (row_record[2] === null) continue;
        record_drop.trade_shop = ((row_record[2].comment === "0") ? false : true);

        //領域idの設定
        for (let array_num = 0; array_num < region_col.length; array_num++) {
            record_drop.region_id.push(parseInt(Enumerable
                .From(row_record)
                .Where((record) => {
                    return (record.col === region_col[array_num]);
                })
                .Select((record) => { return record.comment })
                .FirstOrDefault()
                , 10));
        }

        //狩場idの設定
        for (let array_num = 0; array_num < hunt_area_col.length; array_num++) {
            record_drop.hunt_area_id.push(parseInt(Enumerable
                .From(row_record)
                .Where((record) => {
                    return (record.col === hunt_area_col[array_num]);
                })
                .Select((record) => { return record.comment })
                .FirstOrDefault()
                , 10));

        }
        drop_table.drop_table_rows.push(record_drop);
    }
    return drop_table;
}


//選択された狩場に対してのテーブルを返す
const CreateSelectedData = (_data_table, _hunt_area_id) => {

    let select_drop_table = Enumerable.From(_data_table.drop_table.drop_table_rows)
        .Where((element) => {
            return ((Enumerable.From(element.hunt_area_id).Contains(_hunt_area_id)) ||
                (Enumerable.From(element.region_id).Contains((_hunt_area_id - (_hunt_area_id % 1000)))) ||
                (Enumerable.From(element.region_id).Contains(1000)));
        })
        .ToArray();
    return select_drop_table;
}

//カンマ区切りを解除する関数
const RemoveFigure = (_strPrice) => {
    return parseInt(_strPrice.split(',').join('').trim());
}
// カンマ区切りに変換する関数
const AddFigure = (_str) => {
    var num = new String(_str).replace(/,/g, "");
    while (num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
    return num;
}

//アイテムの列のテンプレート
const GetTableCellString = (_num) =>{
    return '<tr id = \"item'+_num+'\">'+
                '<th scope=\"row\" id = \"name\">アイテム名</th>'+
                '<td id = \"price\">値段</td>'+
                '<td id = \"number\"><input type=\"number\" min = \"0\" max = \"10000000\" />'+
                '<td id = \"sum\"></td>'+
                '<td id = \"taxed\"></td>'+
            '</tr>';
}

//表の作成
const SetupTable=(_selected_drop_table)=>{
$('#table_body').empty();
        for(let i=0;i<_selected_drop_table.length;i++){
            $('#table_body').append(GetTableCellString(i));
            $('#table_body > #item'+i+' > #name').html(_selected_drop_table[i].item_name);
            $('#table_body > #item'+i+' > #price').html(AddFigure(_selected_drop_table[i].sellvalue));
            $('#table_body > #item'+i+' > #number > input').val(0);
            $('#table_body > #item'+i+' > #sum').html(0);
            $('#table_body > #item'+i+' > #taxed').html(0);
            $('#table_body > #item'+i).on("change","#number > input",()=>{
                if($('#table_body > #item'+i+' > #number > input').val()===""){
                   $('#table_body > #item'+i+' > #number > input').val(0); 
                }
                CountTable(_selected_drop_table,i);
                CountSum(_selected_drop_table.length);
                CountMonyPerHour();
            });
            
        }
        $('#table_body').append('<tr id = \"sum_record\">'+
                            '<th scope=\"row\" id = \"name\">合計</th>'+
                            '<td id = \"price\">0</td>'+
                            '<td id = \"number\">0</input>'+
                            '<td id = \"sum\">0</td>'+
                            '<td id = \"taxed\">0</td>'+
                        '</tr>)');

        CountSum(_selected_drop_table.length);//合計値を計算して入れておく  
        return _selected_drop_table.length;
}

//アイテムの表の計算（全列）
const CountAllTales=(_selected_drop_table,_num) =>{
    for(let i=0;i<_num;i++){
            CountTable(_selected_drop_table,i);
        }
}

//アイテムの表の計算（単体の列）
const CountTable = (_selected_drop_table,i)=>{
    $('#table_body > #item'+i+' > #sum')
                    .html(AddFigure(_selected_drop_table[i].sellvalue * parseInt($('#table_body > #item'+i+' > #number > input').val(),10)));
            $('#table_body > #item'+i+' > #taxed')
                    .html((_selected_drop_table[i].trade_shop)?
                            AddFigure(Math.round(RemoveFigure($('#table_body > #item'+i+' > #sum').html())*(((100 - (parseFloat( $('#tax_value').val())))*0.01)))):
                            $('#table_body > #item'+i+' > #sum').html());
}

//アイテム表の合計の計算
const CountSum = (_row_size) =>{
    let all_sum = 0;
    let taxed_sum = 0;
    for(let i=0;i<_row_size;i++){
            all_sum += (RemoveFigure($('#table_body > #item'+i+' > #sum').html()));
            taxed_sum += (RemoveFigure($('#table_body > #item'+i+' > #taxed').html()));
        }
    $('#table_body > #sum_record > #sum').html(AddFigure(all_sum));
    $('#table_body > #sum_record > #taxed').html(AddFigure(taxed_sum));
}

//時給の計算
const CountMonyPerHour = () => {
let taxed_sum = RemoveFigure($('#table_body > #sum_record > #taxed').html());
let length_scale = (parseFloat($(hunt_time).val())/60.0);
$('#money_per_hour').val(AddFigure(Math.round(taxed_sum * length_scale)));
}