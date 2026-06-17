namespace BaseCore.Common
{
    public static class Constants
    {
        public static int PAGE_SIZE_DEFAULT = 10;
        public static string FORMAT_DATE_TIME = "dd/MM/yyyy hh:MM:ss";
        public static string FORMAT_DATE = "dd/MM/yyyy";

        public static string RootCache = "PLM_";

        public static string Table_User = "user";
        public static string Table_Role = "role";

        public static string KeyGetListUser = Table_User + ":GetListUser_{0}_{1}:{2}";
        public static string KeyGetListRole = Table_Role + ":GetListRole_{0}_{1}:{2}";
    }
}
