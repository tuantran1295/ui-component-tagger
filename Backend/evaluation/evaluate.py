import os
import json
import numpy as np
from collections import defaultdict
from tqdm import tqdm
from sklearn.metrics import precision_recall_fscore_support

# --- Settings ---
IOU_THRESHOLD = 0.5
TAGS = ['button', 'input', 'radio', 'dropdown']

def iou(boxA, boxB):
    """Compute Intersection over Union (IoU) between two boxes."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    interArea = interW * interH
    areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    union = areaA + areaB - interArea
    if union == 0: return 0
    return interArea / union

def match_boxes(gt_boxes, pred_boxes, tag):
    """
    Given gt_boxes and pred_boxes both lists of dicts {'box': [..], 'tag': ...}
    Return (num_correct_preds, num_gt, num_preds)
    """
    gt = [b["box"] for b in gt_boxes if b["tag"] == tag]
    preds_all = [b["box"] for b in pred_boxes if b["tag"] == tag]
    matched_gt = set()
    matched_pred = set()
    for gt_idx, gt_box in enumerate(gt):
        for pred_idx, pred_box in enumerate(preds_all):
            if pred_idx in matched_pred:
                continue
            if iou(gt_box, pred_box) >= IOU_THRESHOLD:
                matched_gt.add(gt_idx)
                matched_pred.add(pred_idx)
                break  # Found match, stop
    return len(matched_gt), len(gt), len(preds_all)

def main(ground_truth_dir, predictions_dir):
    stats = {tag: {"tp":0, "gt":0, "pred":0} for tag in TAGS}
    files = sorted([f for f in os.listdir(ground_truth_dir) if f.endswith(".json")])

    for fname in tqdm(files):
        gt_path = os.path.join(ground_truth_dir, fname)
        pred_path = os.path.join(predictions_dir, fname)
        if not os.path.exists(pred_path):
            print(f"Missing prediction: {fname}")
            continue
        with open(gt_path, "r") as f:
            gt_boxes = json.load(f)
        with open(pred_path, "r") as f:
            pred_boxes = json.load(f)
        for tag in TAGS:
            tp, gt_count, pred_count = match_boxes(gt_boxes, pred_boxes, tag)
            stats[tag]["tp"] += tp
            stats[tag]["gt"] += gt_count
            stats[tag]["pred"] += pred_count

    print("\nEvaluation (IoU >= %.2f):" % IOU_THRESHOLD)
    print("Tag\tGT\tPred\tCorrect\tPrecision\tRecall\t\tF1")
    for tag in TAGS:
        gt = stats[tag]["gt"]
        pred = stats[tag]["pred"]
        tp = stats[tag]["tp"]
        precision = tp / pred if pred > 0 else 0
        recall = tp / gt if gt > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision+recall)>0 else 0
        print(f"{tag}\t{gt}\t{pred}\t{tp}\t{precision:.3f}\t\t{recall:.3f}\t\t{f1:.3f}")

    # Macro averages
    total_gt = sum(stats[tag]["gt"] for tag in TAGS)
    total_pred = sum(stats[tag]["pred"] for tag in TAGS)
    total_tp = sum(stats[tag]["tp"] for tag in TAGS)
    precision = total_tp/total_pred if total_pred > 0 else 0
    recall = total_tp/total_gt if total_gt > 0 else 0
    f1 = 2*precision*recall/(precision+recall) if (precision+recall)>0 else 0
    print(f"\nMacro Avg\t{total_gt}\t{total_pred}\t{total_tp}\t{precision:.3f}\t\t{recall:.3f}\t\t{f1:.3f}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate LLM predictions against ground truth.")
    parser.add_argument("--ground-truth", type=str, required=True,
                        help="Folder containing ground truth JSONs")
    parser.add_argument("--predictions", type=str, required=True,
                        help="Folder containing LLM-predicted JSONs")
    args = parser.parse_args()
    main(args.ground_truth, args.predictions)