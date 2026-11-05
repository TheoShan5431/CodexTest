using Newtonsoft.Json;
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace COM.XQ.U9Plug.PostPOEDI.PlugBE
{
    public class HttpRequests
    {
        private static readonly HttpClient client = new HttpClient();
        private static string config = "D:/EdiLog";

        public static async Task<string> GetAsync(string url)
        {
            var response = await client.GetAsync(url);
            if(!response.IsSuccessStatusCode)
            {
                writeFileLog($"GET请求失败，状态码：{response.StatusCode}, 原因短语：{response.ReasonPhrase}");
            }
            return await response.Content.ReadAsStringAsync();
        }

        public static async Task<string> PostAsync(string url,object content)
        {
            string jsonContent = content is string ? (string)content : JsonConvert.SerializeObject(content);
            var httpContent = new StringContent(jsonContent,Encoding.UTF8,"application/json");           
            var response = await client.PostAsync(url,httpContent);

            if(!response.IsSuccessStatusCode)
            {
                writeFileLog($"POST请求失败，状态码：{response.StatusCode}, 原因短语：{response.ReasonPhrase}");
            }

            return await response.Content.ReadAsStringAsync();
        }

        /// <returns></returns>
        public static async Task<string> PostAsync(string url,object content,string authToken)
        {
            string jsonContent = content is string ? (string)content : JsonConvert.SerializeObject(content);
            var httpContent = new StringContent(jsonContent,Encoding.UTF8,"application/json");

            // 创建HttpRequestMessage对象
            var request = new HttpRequestMessage(HttpMethod.Post,url)
            {
                Content = httpContent
            };

            // 设置自定义头部
            request.Headers.TryAddWithoutValidation("x-rssbus-authtoken",authToken);
            request.Headers.TryAddWithoutValidation("Content-Type","application/json");

            using(var response = await client.SendAsync(request))
            {
                if(!response.IsSuccessStatusCode)
                {
                    writeFileLog($"POST请求失败，状态码：{response.StatusCode}, 原因短语：{response.ReasonPhrase}");
                }

                return await response.Content.ReadAsStringAsync();
            }
        }
        /// <summary>
        /// 日志记录
        /// </summary>
        /// <param name="code"></param>
        public static void writeFileLog(string data)
        {
            string fileDirectory = DateTime.Now.ToString("yyyy-MM-dd");
            fileDirectory = config + "\\Log\\" + fileDirectory;
            if(System.IO.Directory.Exists(fileDirectory) == false)
                System.IO.Directory.CreateDirectory(fileDirectory);

            string file = fileDirectory + "\\Log.log";
            if(!System.IO.File.Exists(file))
            {
                FileStream fs = new FileStream(file,FileMode.Create,FileAccess.Write);
                fs.Close();
                fs.Dispose();
            }
            StreamWriter sw = new StreamWriter(file,true,System.Text.Encoding.UTF8);
            sw.WriteLine(DateTime.Now.ToString("yy-MM-dd HH:mm:ss - ") + data);
            sw.Close();
            sw.Dispose();
        }


    }
}
