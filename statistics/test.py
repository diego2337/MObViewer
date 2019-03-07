from sklearn.cluster.bicluster import SpectralCoclustering
import numpy as np

X = np.array([[1, 1], [2, 1], [1, 0],[4, 7], [3, 5], [3, 6]])
clustering = SpectralCoclustering(n_clusters=2, random_state=0).fit(X)
print(clustering.row_labels_)
print(clustering.column_labels_)