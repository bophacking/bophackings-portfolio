#!/usr/bin/env python3
"""Export the two scikit-learn LinearRegression projects (SPICE, Topt) to JSON for in-browser inference,
and generate parity fixtures by running the ORIGINAL Flask pipelines.

usage: python3 tools/export-models.py [--spice DIR] [--compbio DIR]
needs: numpy pandas scikit-learn openpyxl biopython
"""
import argparse, json, os, pickle, random, re, shutil, warnings
warnings.filterwarnings("ignore")
import numpy as np, pandas as pd
import sklearn, Bio
from Bio.SeqUtils.ProtParam import ProteinAnalysis

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument("--spice", default="/home/claude/bophacking/spice")
ap.add_argument("--compbio", default="/home/claude/bophacking/compbio-project")
args = ap.parse_args()
W = lambda rel, obj: (os.makedirs(os.path.dirname(os.path.join(ROOT, rel)), exist_ok=True),
                      open(os.path.join(ROOT, rel), "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=1) if not isinstance(obj, str) else obj))
env = f"scikit-learn {sklearn.__version__}, biopython {Bio.__version__}, pandas {pd.__version__}, numpy {np.__version__}"
rng = random.Random(42)

# =====================================================================  TOPT (CompBio-Project)
AA = "ACDEFGHIKLMNPQRSTVWY"
A = pickle.load(open(f"{args.compbio}/model_no_ogt.pkl", "rb"))
B = pickle.load(open(f"{args.compbio}/model_with_ogt.pkl", "rb"))
assert len(A.coef_) == 23 and len(B.coef_) == 24

def compute_features(sequence):                      # verbatim from compbio-project/app.py
    amino_acids = 'ACDEFGHIKLMNPQRSTVWY'
    clean_seq = ''.join([aa for aa in sequence.upper() if aa in amino_acids])
    if len(clean_seq) < 5:
        return None
    composition = np.zeros(20)
    for aa in clean_seq:
        composition[amino_acids.index(aa)] += 1
    composition = composition / len(clean_seq)
    analysis = ProteinAnalysis(clean_seq)
    return np.append(composition, [analysis.molecular_weight(), analysis.isoelectric_point(), analysis.gravy()])

names = [f"frac_{a}" for a in AA] + ["mol_weight", "isoelectric_point", "gravy"]
W("content/topt/model.json", {
    "about": "Linear regression coefficients exported from model_no_ogt.pkl and model_with_ogt.pkl by tools/export-models.py",
    "exported_with": env,
    "feature_names": names, "amino_acids": AA,
    "model_a": {"label": "Sequence only", "intercept": float(A.intercept_), "coef": [float(c) for c in A.coef_]},
    "model_b": {"label": "Sequence + OGT", "intercept": float(B.intercept_), "coef": [float(c) for c in B.coef_], "extra_feature": "ogt"},
    # figures are the ones stated in the project README (test split); the Flask UI quoted +-13 C / +-10 C
    "metrics": {"a": {"r2": 0.28, "rmse": 13.2, "mae": 10.4}, "b": {"r2": 0.42, "rmse": 10.8, "mae": 8.1}},
    "dataset": {"name": "sequence_ogt_topt.xlsx (TOMER design dataset)", "samples": 2917, "source": "https://github.com/jafetgado/tomerdesign"},
})

# samples (from the README "sample inputs")
samples = {
 "Q97X08": (80, 74, "MIMNKLYIIIVPIIVIIVVGVIGGAIYLHHQSPNVKTSSITVTTNEPVVKIPDQYRVTMTPDPKAFNDNLVPVFNEMGVSVNEIGDVFEGQPVTIPLNATLQGPYMVGSGSATFASNAANGAIIGATVGAFFIGWMIKSRKKEDE"),
 "O28268": (85, 85, "MRVLVVDDEPAIREGMLKFYLEREPDVEVVGEAEDGQEALDLAEQSGPDLVLLDLMLPGMDGIELCRRIRSDSATPIIMLTAKDDEYDKVLGLEIGADDYVTKPFSTREELLARIRAVAERNARRTG"),
 "O59373": (70, 80, "MKILIVDDEKPIVEEGLIYLLEQEGYEVDCAADGREALDMYEQNKPDLILLDLMLPGLDGFEFCRRIRSDSNTPIIMLTAKDDEYDKVLGLEIGADDYVTKPFSTREELLARIRAVAERNAKRTG"),
}
for uid, (topt, ogt, seq) in samples.items():
    body = "\n".join(seq[i:i+60] for i in range(0, len(seq), 60))
    W(f"content/topt/samples/{uid}.fasta", f">{uid} reference_topt={topt} ogt={ogt}\n{body}\n")
shutil.copy(f"{args.compbio}/templates/comparison.png", os.path.join(ROOT, "content/topt/comparison.png"))

# parity fixtures: dataset sequences + samples + edge cases
df = pd.read_excel(f"{args.compbio}/sequence_ogt_topt.xlsx")
raws = [(s, None) for s in rng.sample(list(df["sequence"]), 350)]
raws += [(s, float(o)) for s, (_, o, _) in zip([v[2] for v in samples.values()], samples.values())]
firsts = ["A", "M", "S", "P", "T", "V", "E", "G", "K", "W"]
raws += [(f + "LKFWQRHN" + c, None) for f in firsts for c in "DEKA"]            # terminal pK branches
raws += [("mkv laa 123 GG*\n", 37.0), ("ACDEF", 25.0), ("ACDE", 25.0), ("", 0.5), ("XXXXXXXXXX", 10.0),
         ("BZUO" + "ACDEFGHIKLMNPQRSTVWY" * 3, 55.5), ("A" * 5000, 60.0), ("HHHHHHHHHHHHHH", 12.0), ("KKKKKKKRRRRRR", 99.0),
         ("DDDDDDDDDDEEEEEEE", 45.0), ("CYCYCYCYCYAAA", 33.3)]
cases = []
for raw, ogt in raws:
    ogt = ogt if ogt is not None else round(rng.uniform(10, 100), 1)
    f = compute_features(raw)
    if f is None:
        cases.append({"raw": raw, "ogt": ogt, "expect": None}); continue
    cases.append({"raw": raw, "ogt": ogt, "expect": {
        "vec": [float(x) for x in f],
        "topt_a": float(A.predict(f.reshape(1, -1))[0]),
        "topt_b": float(B.predict(np.append(f, ogt).reshape(1, -1))[0])}})
W("tools/parity/topt-fixtures.json", {"exported_with": env, "cases": cases})
print("topt: fixtures", len(cases), "(", sum(c['expect'] is None for c in cases), "rejected as too short )")

# =====================================================================  SPICE
model = pickle.load(open(f"{args.spice}/price_model.pkl", "rb"))
cols = pickle.load(open(f"{args.spice}/model_columns.pkl", "rb"))
train = pd.read_csv(f"{args.spice}/restaurant_sales_malaysian_data.csv")
DROP = ["menu_item_name", "key_ingredients_tags", "date", "actual_selling_price", "restaurant_id"]
X = train.drop(columns=["actual_selling_price"] + [c for c in DROP if c != "actual_selling_price"], errors="ignore")
assert pd.get_dummies(X, drop_first=True).columns.tolist() == cols, "model_columns differ from get_dummies(drop_first=True)"
cat_cols = [c for c in X.columns if X[c].dtype == object or str(X[c].dtype).startswith("str")]
cats = {c: {"baseline": sorted(X[c].dropna().unique())[0], "values": sorted(X[c].dropna().unique())} for c in cat_cols}
num_cols = [c for c in X.columns if c not in cat_cols]
assert [c for c in cols if c in num_cols] == num_cols and len(cols) == len(num_cols) + sum(len(v["values"]) - 1 for v in cats.values())

# does the shipped pickle reproduce the figures printed on the repo's plot.png (MAE 3.06, R2 0.726)?
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
Xe = pd.get_dummies(X, drop_first=True)
_, Xte, _, yte = train_test_split(Xe, train["actual_selling_price"], test_size=0.2, random_state=42)
p = model.predict(Xte)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
mae_, r2_ = mean_absolute_error(yte, p), r2_score(yte, p)
plt.figure(figsize=(7, 6)); plt.scatter(yte, p, alpha=0.6); plt.plot([yte.min(), yte.max()], [yte.min(), yte.max()], linestyle="--")
plt.xlabel("Actual Selling Price"); plt.ylabel("Predicted Selling Price"); plt.title(f"Predicted vs Actual Selling Price\nMAE: {mae_:.2f}, R\u00b2: {r2_:.3f}")
plt.tight_layout(); plt.savefig(os.path.join(ROOT, "content/spice/plot.png"), dpi=100); plt.close()
print("spice: recomputed on notebook split  MAE %.2f  R2 %.3f  (plot.png says 3.06 / 0.726)" % (mean_absolute_error(yte, p), r2_score(yte, p)))

W("content/spice/model.json", {
    "about": "Linear regression coefficients exported from price_model.pkl by tools/export-models.py",
    "exported_with": env, "target": "actual_selling_price",
    "columns": cols, "coef": [float(c) for c in model.coef_], "intercept": float(model.intercept_),
    "numeric": num_cols, "categories": cats,
    "price_level": {"cheap_below": 9, "average_below": 14},
    "metrics": {"mae": 3.06, "r2": 0.726},
    "dataset": {"name": "Malaysian restaurant menu price data", "rows": int(len(train)), "credit": "jordanchan20 on Kaggle", "url": "https://www.kaggle.com/datasets/jordanchan20/restaurant-menu-price"},
})
shutil.copy(f"{args.spice}/sample input.csv", os.path.join(ROOT, "content/spice/sample-input.csv"))
train.sample(12, random_state=7).to_csv(os.path.join(ROOT, "content/spice/sample-training-rows.csv"), index=False)   # real rows incl. actual prices

def flask_pipeline(df):                              # verbatim logic from spice/app.py
    d = df.drop(columns=DROP, errors="ignore")
    enc = pd.get_dummies(d).reindex(columns=cols, fill_value=0)
    pred = model.predict(enc)
    out = []
    for i, v in enumerate(pred):
        lvl = "Cheap" if v < 9 else ("Average" if v < 14 else "Expensive")
        cost = df["typical_ingredient_cost"].iloc[i] if "typical_ingredient_cost" in df.columns else None
        out.append({"pred": float(v), "level": lvl, "profit": None if cost is None or pd.isna(cost) else float(v - cost)})
    return out

fx = {}
def add(name, df):
    path = os.path.join(ROOT, "tools/parity", name)
    df.to_csv(path, index=False)
    fx[name] = flask_pipeline(pd.read_csv(path))     # re-read exactly as the Flask app would
add("spice-sample.csv", pd.read_csv(f"{args.spice}/sample input.csv"))
sub = train.sample(300, random_state=42)
add("spice-train300.csv", sub)
add("spice-nocost.csv", sub.drop(columns=["typical_ingredient_cost"]).head(60))
edge = sub.head(40).copy()
edge["restaurant_type"] = ["Mamak", "Cafe", "Fast Food", "Casual Dining"] * 10
edge["category"] = ["Meat", "Beverage", "Burger", "Pasta"] * 10
add("spice-edge.csv", edge)
W("tools/parity/spice-expected.json", {"exported_with": env, "files": fx})
print("spice: fixtures", {k: len(v) for k, v in fx.items()})
print("exported with", env)
