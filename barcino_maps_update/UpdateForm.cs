using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Security.Cryptography;

namespace BarcinoMapsUpdate
{
    public partial class UpdateForm : Form
    {
        struct RemoteFile
        {
            public string name;
            public string path;
            public string remotePath;
            public string sha;
            public long size;

        }

        private SHA256 Sha256 = SHA256.Create();
        private SHA1 Sha1 = SHA1.Create();
        string myDocumentsPath;
        string modsPath;
        string githubUrl = $"https://api.github.com/repos/alexsualdea/0ad_barcino/contents/user/maps/random";

        public UpdateForm()
        {
            InitializeComponent();
            myDocumentsPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            modsPath = Path.Combine(myDocumentsPath, "My Games\\0ad\\mods");
        }

        void updateProgress(FileInfo fi, bool isDownloadingFile)
        {
            progressBar.Value++;
            progressBar.Update();
            if (isDownloadingFile)
                textBox.AppendText("Descendit " + fi.Name + Environment.NewLine);
            if (progressBar.Value == progressBar.Maximum)
            {
                textBox.AppendText("Iustum. Roma victrix!" + Environment.NewLine);
                buttonUpdate.Enabled = true;
            }
        }


        async Task<bool> downloadFile(string remoteFileName, string localFilename)
        {
            using (WebClient wc = new WebClient())
            {
                wc.Headers.Add("a", "a");
                try
                {
                    FileInfo fi = new FileInfo(localFilename);
                    wc.DownloadFileCompleted += (sender, e) => { updateProgress(fi, true); };
                    wc.DownloadFileAsync(new Uri(remoteFileName), localFilename);
                    return true;
                }
                catch (Exception ex)
                {
                    textBox.AppendText(ex.Message + Environment.NewLine);
                    return false;
                }
            }
        }

        async Task<IEnumerable<RemoteFile>> GetFileList(string baseUrl)
        {
            List<RemoteFile> ret = new List<RemoteFile>();
            var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("BarcinoMapsUpdate", "0.1"));
            httpClient.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Token", "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");
            var contentsUrl = baseUrl;
            var contentsJson = await httpClient.GetStringAsync(contentsUrl);
            var contents = (Newtonsoft.Json.Linq.JArray)JsonConvert.DeserializeObject(contentsJson);
            foreach (var file in contents)
            {
                var fileType = (string)file["type"];
                if (fileType == "dir")
                {
                    var directoryContentsUrl = (string)file["url"];
                    var relativeDir = (string)file["name"];
                    if (relativeDir.Substring(0, 1) == ".")
                        continue;
                    IEnumerable<RemoteFile> files = await GetFileList(directoryContentsUrl);
                    ret.AddRange(files);
                }
                else if (fileType == "file")
                {
                    RemoteFile rf = new RemoteFile();
                    rf.remotePath = (string)file["download_url"];
                    rf.name = (string)file["name"];
                    rf.path = (string)file["path"];
                    rf.sha = (string)file["sha"];
                    rf.size = (long)file["size"];
                    ret.Add(rf);
                }
            }
            return ret;
        }


        private async Task<string> GetHashSha1FrikadaDeGithub(string filename)
        {
            long filesize = new FileInfo(filename).Length;
            byte[] frikada1 = Encoding.ASCII.GetBytes("blob ");
            byte[] size = Encoding.ASCII.GetBytes(filesize.ToString());
            byte[] bfile = File.ReadAllBytes(filename);
            byte[] zero = Encoding.ASCII.GetBytes("\0");
            byte[] frikada = new byte[bfile.Length + frikada1.Length + size.Length + zero.Length];

            System.Buffer.BlockCopy(frikada1, 0, frikada, 0, frikada1.Length);
            System.Buffer.BlockCopy(size, 0, frikada, frikada1.Length, size.Length);
            System.Buffer.BlockCopy(bfile, 0, frikada, frikada1.Length + size.Length, bfile.Length);
            System.Buffer.BlockCopy(zero, 0, frikada, frikada1.Length + size.Length, zero.Length);
            System.Buffer.BlockCopy(bfile, 0, frikada, frikada1.Length + size.Length + zero.Length, bfile.Length);

            byte[] buf = Sha1.ComputeHash(frikada);
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < buf.Length; i++)
            {
                builder.Append(buf[i].ToString("x2"));
            }
            return builder.ToString();
        }


        private async Task<bool> UpdateGitHub()
        {
            try
            {
                IEnumerable<RemoteFile> files = await GetFileList(githubUrl);
                progressBar.Maximum = files.Count();
                progressBar.Value = 0;
                foreach (var f in files)
                {
                    string localPath = Path.GetFullPath(Path.Combine(modsPath, f.path));
                    if (File.Exists(localPath))
                    {
                        string localSha = await GetHashSha1FrikadaDeGithub(localPath);
                        if (localSha != f.sha)
                        {
                            System.Threading.Thread.Sleep(50); // without this sleep some files are missing
                            bool ok = await downloadFile(f.remotePath, localPath);
                            if (!ok)
                                break;
                        }
                        else
                        {
                            updateProgress(new FileInfo(localPath), false);
                        }
                    }
                    else 
                    {
                        string dir_path = Path.GetDirectoryName(localPath);
                        if (!Directory.Exists(dir_path))
                            System.IO.Directory.CreateDirectory(dir_path);
                        bool ok = await downloadFile(f.remotePath, localPath);
                        if (!ok)
                            break;
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                textBox.AppendText(ex.Message + Environment.NewLine);
                buttonUpdate.Enabled = true;
                return false;
            }
        }

        private async void buttonUpdate_Click(object sender, EventArgs e)
        {
            textBox.Text = "";
            buttonUpdate.Enabled = false;
            textBox.AppendText("Cognoscere ..." + Environment.NewLine);
            bool ok = await UpdateGitHub();
            if (!ok)
            {
                textBox.AppendText("Sed error occurrit." + Environment.NewLine);
                buttonUpdate.Enabled = true;
            }
        }
    }
}
