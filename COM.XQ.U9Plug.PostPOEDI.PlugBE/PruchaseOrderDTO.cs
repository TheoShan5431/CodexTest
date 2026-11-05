using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COM.XQ.U9Plug.PostPOEDI.PlugBE
{
    internal class PruchaseOrderDTO
    {
        /// <summary>
        /// 
        /// </summary>
        public string Type { get; set; }
        public string PONo { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public DateTime IssueDate { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public DateTime IssueTime { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string RequisitionOrganization { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string RequisitionAddress { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string Supplier { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string SupplierCode { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string SupplierAddress { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string DunsNumber { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string Countryabbreviation { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string BuyerId { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string SOMEWHERE { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string Country { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public DateTime StartDate { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public DateTime EndDate { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string Warehouse { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public List<LineItems> LineItems { get; set; }
              

    }
    public class ItemDTO
    {
        /// <summary>
        /// 
        /// </summary>
        public int LineNumber { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public decimal Quantity { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public DateTime PlanArriveDate { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string UNIT { get; set; }
    }

    public class LineItems
    {
        /// <summary>
        /// 
        /// </summary>
        public string PartNo { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public string ItemCode { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public List<ItemDTO> ItemDTO { get; set; }
    }
}
